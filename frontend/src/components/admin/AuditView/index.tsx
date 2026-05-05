import { useAuditView } from './useAuditView';
import { AuditHeader } from './AuditHeader';
import { AuditFiltersPanel } from './AuditFiltersPanel';
import { AuditLogList } from './AuditLogList';
import { AuditPagination } from './AuditPagination';
import { AuditLogDetailModal } from './AuditLogDetailModal';

export default function AuditView() {
  const { filters, setters, derived, queries, handlers } = useAuditView();
  const { page, limit, showFilters, selectedLog } = filters;
  const { setPage, setShowFilters, setSelectedLog } = setters;
  const { filteredLogs, actionsForCategory, activeFiltersCount, stats } = derived;
  const { users, entityTypes, meta, isLoading, isFetching, refetch } = queries;
  const { clearFilters, exportToCSV } = handlers;

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-4 space-y-4">
        <AuditHeader
          total={meta.total}
          isFetching={isFetching}
          showFilters={showFilters}
          activeFiltersCount={activeFiltersCount}
          onRefetch={() => refetch()}
          onExport={exportToCSV}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <AuditFiltersPanel
          filters={filters}
          setters={setters}
          users={users}
          entityTypes={entityTypes}
          actionsForCategory={actionsForCategory}
          activeFiltersCount={activeFiltersCount}
          stats={stats}
          onClearFilters={clearFilters}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <AuditLogList
          logs={filteredLogs}
          isLoading={isLoading}
          activeFiltersCount={activeFiltersCount}
          onSelectLog={setSelectedLog}
          onClearFilters={clearFilters}
        />
      </div>

      <AuditPagination
        page={page}
        limit={limit}
        total={meta.total}
        totalPages={meta.totalPages}
        onPageChange={setPage}
      />

      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
