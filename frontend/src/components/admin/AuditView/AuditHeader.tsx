import { Download, Filter, RefreshCw, Shield } from 'lucide-react';

interface AuditHeaderProps {
  total: number;
  isFetching: boolean;
  showFilters: boolean;
  activeFiltersCount: number;
  onRefetch: () => void;
  onExport: () => void;
  onToggleFilters: () => void;
}

export function AuditHeader({
  total,
  isFetching,
  showFilters,
  activeFiltersCount,
  onRefetch,
  onExport,
  onToggleFilters,
}: AuditHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Log de Auditoria</h2>
          <p className="text-sm text-neutral-500">
            {total.toLocaleString('pt-BR')} registros encontrados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefetch}
          disabled={isFetching}
          className="btn btn-secondary btn-sm"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={onExport} className="btn btn-secondary btn-sm" title="Exportar CSV">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
        <button
          onClick={onToggleFilters}
          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">{activeFiltersCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
