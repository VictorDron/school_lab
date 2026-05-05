import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents, useStudentSocketSync, useExportStudentsCsv, useBulkUpdateStudents, useExportSelectedStudentsCsv } from '@/hooks/useStudents';
import { StudentsList } from './list/StudentsList';
import { BulkActionsToolbar } from './list/BulkActionsToolbar';
import { MiniCards } from './list/MiniCards';
import { AdvancedFilters } from './list/AdvancedFilters';
import { Search, Filter, Download } from 'lucide-react';
import { gradeOptions } from '@/constants/grades';
import type { StudentFilters, StudentStatus } from '@/types/students';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const STATUS_OPTIONS: { value: StudentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'TRANSFERRED', label: 'Transferido' },
  { value: 'GRADUATED', label: 'Graduado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const ADVANCED_FILTER_KEYS: (keyof StudentFilters)[] = [
  'parentName',
  'enrolledAfter',
  'enrolledBefore',
  'ageMin',
  'ageMax',
];

export default function StudentsPage() {
  const [filters, setFilters] = useState<StudentFilters>({ page: 1, limit: 25 });
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useStudentSocketSync();

  const { data, isLoading, isError } = useStudents(filters);
  const exportCsv = useExportStudentsCsv();
  const bulkUpdate = useBulkUpdateStudents();
  const exportSelected = useExportSelectedStudentsCsv();

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.search, filters.grade, filters.academicYear, filters.status, filters.page]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = useCallback(
    (key: keyof StudentFilters, value: string | number | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    },
    []
  );

  const handleClearAdvancedFilters = useCallback(() => {
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      for (const key of ADVANCED_FILTER_KEYS) {
        delete next[key];
      }
      return next;
    });
  }, []);

  const handleSort = useCallback((field: NonNullable<StudentFilters['sortBy']>) => {
    setFilters((prev) => {
      if (prev.sortBy === field) {
        return { ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc', page: 1 };
      }
      return { ...prev, sortBy: field, sortOrder: 'asc', page: 1 };
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    const students = data?.data ?? [];
    setSelectedIds((prev) => {
      const allSelected = students.every((s) => prev.has(s.id));
      if (allSelected) return new Set();
      return new Set(students.map((s) => s.id));
    });
  }, [data]);

  const miniCardStats = useMemo(() => {
    const students = data?.data ?? [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
    const newThisMonth = students.filter((s) => {
      const d = new Date(s.enrolledAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const withAlerts = students.filter(
      (s) => s.alerts && (s.alerts.pendingDocs || s.alerts.contractExpiring || s.alerts.reEnrollmentPending)
    ).length;

    return {
      total: data?.meta?.total ?? 0,
      activeCount,
      newThisMonth,
      withAlerts,
    };
  }, [data]);

  return (
    <div className="h-full flex flex-col">
      {/* Mini cards */}
      <div className="flex-shrink-0 px-4 lg:px-6 pt-4">
        <MiniCards
          total={miniCardStats.total}
          activeCount={miniCardStats.activeCount}
          newThisMonth={miniCardStats.newThisMonth}
          withAlerts={miniCardStats.withAlerts}
        />
      </div>

      {/* Filter bar */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-3 mt-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
          {data?.meta?.total != null && (
            <span>{data.meta.total} {data.meta.total === 1 ? 'aluno encontrado' : 'alunos encontrados'}</span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nome, código ou CPF..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-400 flex-shrink-0" />

            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', (e.target.value as StudentStatus) || undefined)}
              className="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={filters.academicYear || ''}
              onChange={(e) => handleFilterChange('academicYear', e.target.value ? Number(e.target.value) : undefined)}
              className="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Todos os anos</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={filters.grade || ''}
              onChange={(e) => handleFilterChange('grade', e.target.value || undefined)}
              className="text-sm border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Todas as turmas</option>
              {gradeOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.en}</option>
              ))}
            </select>

            {/* Export CSV */}
            <button
              type="button"
              onClick={() => exportCsv.mutate(filters)}
              disabled={exportCsv.isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
              title="Exportar CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        <div className="mt-3">
          <AdvancedFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClearAdvancedFilters}
          />
        </div>
      </div>

      <StudentsList
        students={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onStudentClick={(id: string) => navigate(`/students/${id}`)}
        pagination={
          data?.meta
            ? {
                page: data.meta.page,
                totalPages: data.meta.totalPages,
                total: data.meta.total,
                pageSize: filters.limit ?? 25,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }
            : undefined
        }
      />

      <BulkActionsToolbar
        selectedIds={Array.from(selectedIds)}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkAction={(action) => {
          bulkUpdate.mutate(
            { ids: Array.from(selectedIds), action },
            { onSuccess: () => setSelectedIds(new Set()) }
          );
        }}
        onExportSelected={() => exportSelected.mutate(Array.from(selectedIds))}
        isLoading={bulkUpdate.isPending || exportSelected.isPending}
      />

    </div>
  );
}
