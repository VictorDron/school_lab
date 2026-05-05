import { Clock, CheckCircle } from 'lucide-react';
import type { OverdueInvite } from '@/types/re-enrollment';

interface OverdueFamiliesTableProps {
  overdueInvites: OverdueInvite[];
}

const MAX_ROWS = 50;

export default function OverdueFamiliesTable({ overdueInvites }: OverdueFamiliesTableProps) {
  const sorted = [...overdueInvites].sort((a, b) => b.daysOverdue - a.daysOverdue);
  const displayed = sorted.slice(0, MAX_ROWS);
  const totalCount = sorted.length;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50">
            <Clock className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">Famílias com Prazo Excedido</h3>
        </div>
        {totalCount > MAX_ROWS && (
          <span className="text-[10px] text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
            Mostrando {MAX_ROWS} de {totalCount}
          </span>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-emerald-700">
            Todas as famílias estão dentro do prazo.
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] text-neutral-500 uppercase border-b border-neutral-100">
                <th className="pb-2 pr-3 font-medium">Aluno</th>
                <th className="pb-2 pr-3 font-medium">Série</th>
                <th className="pb-2 pr-3 font-medium">Etapa Atual</th>
                <th className="pb-2 font-medium text-right">Dias em Atraso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {displayed.map((invite) => (
                <tr key={invite.inviteId} className="text-xs hover:bg-neutral-50 transition-colors">
                  <td className="py-2 pr-3 text-neutral-800 font-medium">{invite.studentName}</td>
                  <td className="py-2 pr-3 text-neutral-500">{invite.grade || '-'}</td>
                  <td className="py-2 pr-3">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-700 rounded-full">
                      {invite.currentStageName}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className="font-bold text-red-600">{invite.daysOverdue} dias</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
