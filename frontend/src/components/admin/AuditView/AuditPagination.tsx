import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: Dispatch<SetStateAction<number>>;
}

export function AuditPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: AuditPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-white border-t border-neutral-200 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} de {total.toLocaleString('pt-BR')}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
