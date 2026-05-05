import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useImportHistory } from '@/hooks/useImport';
import type { ImportHistory, RowError } from '@/types/import';

const PAGE_SIZE = 25;
const MAX_VISIBLE_ERRORS = 20;

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    COMPLETED: { label: 'Conclu\u00EDdo', className: 'bg-green-100 text-green-700' },
    PROCESSING: { label: 'Processando', className: 'bg-yellow-100 text-yellow-700' },
    FAILED: { label: 'Falhou', className: 'bg-red-100 text-red-700' },
  };
  const badge = config[status] || { label: status, className: 'bg-neutral-100 text-neutral-700' };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function ErrorDetail({ errors }: { errors: RowError[] }) {
  const visibleErrors = errors.slice(0, MAX_VISIBLE_ERRORS);
  const remaining = errors.length - MAX_VISIBLE_ERRORS;

  return (
    <div className="bg-neutral-50 border-t border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left px-4 py-2 font-medium text-neutral-600">Linha</th>
            <th className="text-left px-4 py-2 font-medium text-neutral-600">Campo</th>
            <th className="text-left px-4 py-2 font-medium text-neutral-600">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {visibleErrors.map((err, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-b-0">
              <td className="px-4 py-2 text-neutral-500">{err.row}</td>
              <td className="px-4 py-2 font-medium text-neutral-700">{err.field}</td>
              <td className="px-4 py-2 text-neutral-600">{err.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {remaining > 0 && (
        <p className="px-4 py-2 text-xs text-neutral-500">
          e mais {remaining} erros...
        </p>
      )}
    </div>
  );
}

function HistoryRow({ item }: { item: ImportHistory }) {
  const [expanded, setExpanded] = useState(false);
  const hasErrors = item.errors && item.errors.length > 0;

  return (
    <>
      <tr
        onClick={() => hasErrors && setExpanded(!expanded)}
        className={`border-b border-neutral-200 ${hasErrors ? 'cursor-pointer hover:bg-neutral-50' : ''} transition-colors`}
      >
        <td className="px-4 py-3 text-sm text-neutral-700">
          {format(parseISO(item.createdAt), 'dd/MM/yyyy HH:mm')}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-900 font-medium truncate max-w-[200px]">
          {item.fileName}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-700 text-center">{item.totalRows}</td>
        <td className="px-4 py-3 text-sm text-green-700 text-center">{item.created}</td>
        <td className="px-4 py-3 text-sm text-red-700 text-center">{item.failed}</td>
        <td className="px-4 py-3">
          <StatusBadge status={item.status} />
        </td>
        <td className="px-4 py-3 text-neutral-400">
          {hasErrors &&
            (expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
        </td>
      </tr>
      {expanded && hasErrors && item.errors && (
        <tr>
          <td colSpan={7} className="p-0">
            <ErrorDetail errors={item.errors} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function ImportHistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useImportHistory(page, PAGE_SIZE);

  const historyItems = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="p-2 bg-violet-100 rounded-lg">
            <History className="w-5 h-5 text-violet-600" />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">
            Hist&oacute;rico de Importa&ccedil;&otilde;es
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          </div>
        )}

        {!isLoading && historyItems.length === 0 && (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Nenhuma importa&ccedil;&atilde;o realizada ainda.</p>
          </div>
        )}

        {!isLoading && historyItems.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Arquivo
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Criados
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Falhas
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => (
                    <HistoryRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
                <p className="text-xs text-neutral-500">
                  P&aacute;gina {meta.page} de {meta.totalPages} ({meta.total} registros)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={page >= meta.totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Pr&oacute;xima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
