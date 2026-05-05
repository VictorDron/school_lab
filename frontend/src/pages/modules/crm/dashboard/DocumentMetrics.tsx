import { FileCheck, FileX, FileClock } from 'lucide-react';
import type { DashboardStats } from './types';

interface DocumentMetricsProps {
  documents: DashboardStats['documents'];
}

export function DocumentMetrics({ documents }: DocumentMetricsProps) {
  const d = documents ?? {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    completionRate: 0,
  };

  const total = d.approved + d.rejected + d.pending;
  const approvedPct = total > 0 ? (d.approved / total) * 100 : 0;
  const rejectedPct = total > 0 ? (d.rejected / total) * 100 : 0;
  const pendingPct = total > 0 ? (d.pending / total) * 100 : 0;

  return (
    <div>
      {/* Completion rate */}
      <div className="mb-5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs text-neutral-500 mb-0.5">Taxa de Conclusão</p>
            <p className="text-3xl font-bold text-neutral-900">
              {(d.completionRate ?? 0).toFixed(1)}%
            </p>
          </div>
          <p className="text-sm text-neutral-400 mb-1">{d.total} documentos</p>
        </div>
        <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0aacce] rounded-full transition-all"
            style={{ width: `${Math.min(100, d.completionRate ?? 0)}%` }}
          />
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-lg p-3 text-center">
          <FileCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700">{d.approved}</p>
          <p className="text-[11px] text-emerald-600 font-medium">Aprovados</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{approvedPct.toFixed(0)}%</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <FileX className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-600">{d.rejected}</p>
          <p className="text-[11px] text-red-500 font-medium">Rejeitados</p>
          <p className="text-[10px] text-red-400 mt-0.5">{rejectedPct.toFixed(0)}%</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <FileClock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-amber-600">{d.pending}</p>
          <p className="text-[11px] text-amber-500 font-medium">Pendentes</p>
          <p className="text-[10px] text-amber-400 mt-0.5">{pendingPct.toFixed(0)}%</p>
        </div>
      </div>

      {/* Stacked bar */}
      <div className="mt-4">
        <div className="h-2 rounded-full overflow-hidden flex bg-neutral-100">
          {approvedPct > 0 && (
            <div className="h-full bg-emerald-500" style={{ width: `${approvedPct}%` }} />
          )}
          {pendingPct > 0 && (
            <div className="h-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
          )}
          {rejectedPct > 0 && (
            <div className="h-full bg-red-500" style={{ width: `${rejectedPct}%` }} />
          )}
        </div>
      </div>
    </div>
  );
}
