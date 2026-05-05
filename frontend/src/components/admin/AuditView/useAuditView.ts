import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { endOfDay, format, startOfDay } from 'date-fns';
import { get } from '@/lib/api';
import {
  AuditLog,
  AuditResponse,
  User as AuditUser,
  actionCategories,
  dateRanges,
} from './constants';
import { getActionInfo } from './helpers';

export function useAuditView() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('last7');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedUser, selectedAction, selectedEntityType, selectedDateRange, customStartDate, customEndDate]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (selectedLog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedLog]);

  // Calculate date range
  const dateRange = useMemo(() => {
    if (selectedDateRange === 'custom') {
      return {
        start: customStartDate ? startOfDay(new Date(customStartDate)) : undefined,
        end: customEndDate ? endOfDay(new Date(customEndDate)) : undefined,
      };
    }
    const range = dateRanges.find((r) => r.id === selectedDateRange);
    return range ? range.getValue() : { start: undefined, end: undefined };
  }, [selectedDateRange, customStartDate, customEndDate]);

  // Fetch users for filter
  const { data: usersData } = useQuery({
    queryKey: ['users-filter'],
    queryFn: () => get<AuditUser[]>('/users'),
  });
  const users = usersData?.data || [];

  // Fetch available actions
  const { data: actionsData } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => get<string[]>('/audit/actions'),
  });
  const availableActions = actionsData?.data || [];

  // Fetch entity types
  const { data: entityTypesData } = useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: () => get<string[]>('/audit/entity-types'),
  });
  const entityTypes = entityTypesData?.data || [];

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      page,
      limit,
    };
    if (selectedUser) params.actorId = selectedUser;
    if (selectedAction) params.action = selectedAction;
    if (selectedEntityType) params.entityType = selectedEntityType;
    if (dateRange.start) params.startDate = dateRange.start.toISOString();
    if (dateRange.end) params.endDate = dateRange.end.toISOString();
    if (debouncedSearch) params.search = debouncedSearch;
    return params;
  }, [page, limit, selectedUser, selectedAction, selectedEntityType, dateRange, debouncedSearch]);

  // Fetch audit logs
  const {
    data: auditData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['audit', queryParams],
    queryFn: () => get<AuditResponse>('/audit', { params: queryParams }),
  });

  const logs = auditData?.data?.logs || [];
  const meta = auditData?.data?.meta || { page: 1, limit: 25, total: 0, totalPages: 0 };

  // Filter logs by category only (client-side) - search is now server-side
  const filteredLogs = useMemo(() => {
    let result = logs;

    if (selectedCategory) {
      const categoryConfig = actionCategories[selectedCategory];
      if (categoryConfig) {
        result = result.filter((log) => categoryConfig.actions.includes(log.action));
      }
    }

    return result;
  }, [logs, selectedCategory]);

  // Get actions for selected category
  const actionsForCategory = useMemo(() => {
    if (!selectedCategory) return availableActions;
    const config = actionCategories[selectedCategory];
    return config ? availableActions.filter((a) => config.actions.includes(a)) : availableActions;
  }, [selectedCategory, availableActions]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedUser('');
    setSelectedCategory('');
    setSelectedAction('');
    setSelectedEntityType('');
    setSelectedDateRange('last7');
    setCustomStartDate('');
    setCustomEndDate('');
    setPage(1);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Email', 'Ação', 'Entidade', 'ID Entidade', 'IP', 'User Agent'];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'),
      log.actor?.displayName || '-',
      log.actorEmail,
      log.action,
      log.entityType || '-',
      log.entityId || '-',
      log.ipAddress || '-',
      log.userAgent || '-',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Count active filters
  const activeFiltersCount = [selectedUser, selectedCategory, selectedAction, selectedEntityType, searchQuery].filter(Boolean).length;

  // Statistics
  const stats = useMemo(() => {
    const actionCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    filteredLogs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      const info = getActionInfo(log.action);
      categoryCounts[info.category] = (categoryCounts[info.category] || 0) + 1;
    });

    return { actionCounts, categoryCounts };
  }, [filteredLogs]);

  return {
    filters: {
      page,
      limit,
      searchQuery,
      selectedUser,
      selectedCategory,
      selectedAction,
      selectedEntityType,
      selectedDateRange,
      customStartDate,
      customEndDate,
      showFilters,
      selectedLog,
    },
    setters: {
      setPage,
      setSearchQuery,
      setSelectedUser,
      setSelectedCategory,
      setSelectedAction,
      setSelectedEntityType,
      setSelectedDateRange,
      setCustomStartDate,
      setCustomEndDate,
      setShowFilters,
      setSelectedLog,
    },
    derived: {
      filteredLogs,
      actionsForCategory,
      activeFiltersCount,
      stats,
    },
    queries: {
      users,
      availableActions,
      entityTypes,
      meta,
      isLoading,
      isFetching,
      refetch,
    },
    handlers: {
      clearFilters,
      exportToCSV,
    },
  };
}
