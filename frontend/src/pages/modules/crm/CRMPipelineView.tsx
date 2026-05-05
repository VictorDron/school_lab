import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { useLeads, useLeadStats, useCrmSocketSync } from '@/hooks/useLeads';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { CreateLeadModal, EditLeadDrawer, ColumnManagerModal } from '@/components/crm';
import { type Lead, type LeadSource } from '@/types/crm';
import { CRMHeader } from './CRMHeader';
import { LeadKanbanView } from './kanban';
import { ListView } from './list';
import { CalendarView } from './calendar';
import { MyPendenciesWidget } from '@/components/crm/MyPendenciesWidget';

type ViewMode = 'kanban' | 'list' | 'calendar';

const KANBAN_LIMIT = 100;
const DEFAULT_PAGE_SIZE = 25;

export default function CRMPipelineView() {
  const { hasModuleAccess } = useAuthStore();
  const navigate = useNavigate();

  // View and filter states
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFlagged, setShowFlagged] = useState(false);
  const [selectedSource, setSelectedSource] = useState<LeadSource | ''>('');

  // Pagination state (list view only)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Modals and drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);

  // Calendar deep-link state (from LeadDrawer event click)
  const [calendarEventId, setCalendarEventId] = useState<string | null>(null);
  const [calendarEventDate, setCalendarEventDate] = useState<Date | null>(null);

  // Local optimistic state for drag operations
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, string>>(new Map());

  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const isAdmin = hasModuleAccess('CRM', 'ADMIN');

  // Real-time CRM updates via Socket.io (CRM-01)
  useCrmSocketSync();

  // Reset pagination when view mode or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, searchQuery, showFlagged, selectedSource]);

  // Fetch kanban columns
  const { data: columnsData, isLoading: columnsLoading } = useKanbanColumns();
  const columns = columnsData?.data || [];

  // Separate pipeline and final columns
  const pipelineColumns = useMemo(() => columns.filter((c) => !c.isFinal), [columns]);
  const finalColumns = useMemo(() => columns.filter((c) => c.isFinal), [columns]);

  // Fetch leads — kanban uses limit:100 (safety cap), list uses paginated results
  const { data: leadsData, isLoading: leadsLoading, refetch } = useLeads({
    search: searchQuery || undefined,
    flagged: showFlagged || undefined,
    source: selectedSource || undefined,
    page: viewMode === 'list' ? currentPage : 1,
    limit: viewMode === 'kanban' ? KANBAN_LIMIT : pageSize,
  });

  const leads = leadsData?.data || [];
  const paginationMeta = leadsData?.meta;
  const isLoading = columnsLoading || leadsLoading;

  // Fetch stats
  const { data: statsData } = useLeadStats();
  const stats = statsData?.data;

  // Determine if any filter is active
  const isFiltered = !!(searchQuery || selectedSource || showFlagged);

  // Compute filtered stats from the already-filtered leads data
  const filteredStats = useMemo(() => {
    if (!isFiltered) return undefined;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    return {
      total: leads.length,
      flagged: leads.filter((l) => l.isFlagged).length,
      thisMonth: leads.filter((l) => new Date(l.createdAt) >= startOfMonth).length,
      thisWeek: leads.filter((l) => new Date(l.createdAt) >= startOfWeek).length,
    };
  }, [leads, isFiltered]);

  // Apply optimistic moves to leads
  const leadsWithOptimisticUpdates = useMemo(() => {
    return leads.map((lead) => {
      const optimisticColumnId = optimisticMoves.get(lead.id);
      if (optimisticColumnId) {
        return { ...lead, columnId: optimisticColumnId };
      }
      return lead;
    });
  }, [leads, optimisticMoves]);

  // Group leads by columnId for Kanban
  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};

    columns.forEach((column) => {
      grouped[column.id] = [];
    });

    leadsWithOptimisticUpdates.forEach((lead) => {
      if (grouped[lead.columnId]) {
        grouped[lead.columnId].push(lead);
      }
    });

    return grouped;
  }, [leadsWithOptimisticUpdates, columns]);

  // Handlers
  const handleLeadClick = (lead: Lead) => {
    navigate(lead.id);
  };

  // Optimistic column update
  const handleOptimisticMove = useCallback((leadId: string, newColumnId: string) => {
    setOptimisticMoves((prev) => new Map(prev).set(leadId, newColumnId));
  }, []);

  const clearOptimisticMove = useCallback((leadId: string) => {
    setOptimisticMoves((prev) => {
      const next = new Map(prev);
      next.delete(leadId);
      return next;
    });
  }, []);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <CRMHeader
        stats={stats}
        filteredStats={filteredStats}
        isFiltered={isFiltered}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        showFlagged={showFlagged}
        setShowFlagged={setShowFlagged}
        canEdit={canEdit}
        isAdmin={isAdmin}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onColumnsClick={() => setIsColumnManagerOpen(true)}
      />

      {/* Pending Approvals Widget */}
      <div className="px-4 pt-3">
        <MyPendenciesWidget
          onSelectLead={(leadId) => {
            navigate(leadId);
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'calendar' ? (
          <CalendarView
            initialEventId={calendarEventId}
            initialDate={calendarEventDate}
            onInitialEventConsumed={() => {
              setCalendarEventId(null);
              setCalendarEventDate(null);
            }}
          />
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === 'kanban' ? (
          <LeadKanbanView
            pipelineColumns={pipelineColumns}
            finalColumns={finalColumns}
            leadsByColumn={leadsByColumn}
            onLeadClick={handleLeadClick}
            canEdit={canEdit}
            onOptimisticMove={handleOptimisticMove}
            onClearOptimisticMove={clearOptimisticMove}
          />
        ) : (
          <ListView
            leads={leadsWithOptimisticUpdates}
            columns={columns}
            onLeadClick={handleLeadClick}
            pagination={paginationMeta ? {
              page: paginationMeta.page,
              totalPages: paginationMeta.totalPages,
              total: paginationMeta.total,
              pageSize,
              onPageChange: setCurrentPage,
              onPageSizeChange: (size: number) => {
                setPageSize(size);
                setCurrentPage(1);
              },
            } : undefined}
          />
        )}
      </div>

      {/* Create Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
      />

      {/* Edit Drawer */}
      <EditLeadDrawer
        lead={selectedLeadForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLeadForEdit(null);
          refetch();
        }}
      />

      {/* Column Manager Modal */}
      <ColumnManagerModal isOpen={isColumnManagerOpen} onClose={() => setIsColumnManagerOpen(false)} />
    </div>
  );
}
