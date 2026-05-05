import { useMemo } from 'react';
import { Users, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sourceConfig, type Lead, type KanbanColumn } from '@/types/crm';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

interface ListViewProps {
  leads: Lead[];
  columns: KanbanColumn[];
  onLeadClick: (lead: Lead) => void;
  pagination?: PaginationProps;
}

export function ListView({ leads, columns, onLeadClick, pagination }: ListViewProps) {
  // Create a map for quick column lookup
  const columnMap = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum lead encontrado</p>
          <p className="text-neutral-500">Cadastre leads para acompanhar o processo de admissão</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable list area */}
      <div className="p-4 lg:p-6 space-y-2 overflow-y-auto flex-1">
        {/* Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-500 uppercase">
          <div className="col-span-3">Lead</div>
          <div className="col-span-2">Contato</div>
          <div className="col-span-2">Coluna</div>
          <div className="col-span-1">Filhos</div>
          <div className="col-span-2">Origem</div>
          <div className="col-span-2">Criado</div>
        </div>

        {/* Table Rows */}
        {leads.map((lead) => {
          const column = columnMap.get(lead.columnId);
          return (
            <div
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md cursor-pointer transition-shadow"
            >
              {/* Lead Info */}
              <div className="lg:col-span-3 flex items-center gap-3">
                {lead.isFlagged && <Flag className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
                <div>
                  <p className="font-semibold text-neutral-900">{lead.familyName}</p>
                  <p className="text-xs text-neutral-500 font-mono">{lead.code}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="lg:col-span-2 text-sm text-neutral-600">
                <p className="truncate">{lead.primaryContactName}</p>
                <p className="text-xs text-neutral-400 truncate">{lead.primaryContactEmail}</p>
              </div>

              {/* Column/Status */}
              <div className="lg:col-span-2">
                {column && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${column.color}20`,
                      color: column.color,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                    {column.name}
                  </span>
                )}
              </div>

              {/* Children */}
              <div className="lg:col-span-1 text-sm text-neutral-600">{lead.numberOfChildren}</div>

              {/* Source */}
              <div className="lg:col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full ${sourceConfig[lead.source]?.bgColor || 'bg-neutral-100'}`}>
                  {sourceConfig[lead.source]?.label || lead.source}
                </span>
              </div>

              {/* Created */}
              <div className="lg:col-span-2 text-sm text-neutral-500">
                {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-neutral-200 rounded-b-lg">
          {/* Left: total count */}
          <div className="text-sm text-neutral-500">
            {pagination.total} {pagination.total === 1 ? 'lead' : 'leads'} no total
          </div>

          {/* Center: page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {/* Page numbers — show up to 5 pages around current */}
            {(() => {
              const pages: number[] = [];
              const start = Math.max(1, pagination.page - 2);
              const end = Math.min(pagination.totalPages, pagination.page + 2);
              for (let i = start; i <= end; i++) pages.push(i);
              return pages.map((p) => (
                <button
                  key={p}
                  onClick={() => pagination.onPageChange(p)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    p === pagination.page
                      ? 'bg-primary-600 text-white'
                      : 'border border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {p}
                </button>
              ));
            })()}

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>

          {/* Right: page size selector */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <span>Exibir</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="border border-neutral-300 rounded-md px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>por página</span>
          </div>
        </div>
      )}
    </div>
  );
}
