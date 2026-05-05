import { useState } from 'react';
import { Send, XCircle, CalendarPlus, Loader2, CheckCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { useReEnrollmentInvites } from '@/hooks/useReEnrollmentAdmin';
import { useResendInvite, useCancelInvite, useExtendDeadline } from '@/hooks/useReEnrollmentDashboard';
import type { ReEnrollmentInviteFull } from '@/types/re-enrollment';
import { differenceInDays } from 'date-fns';

interface InviteManagementTableProps {
  periodId: string;
  grade?: string;
  periodEndDate?: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  OPENED: 'Aberto',
  CONFIRMED: 'Confirmado',
  DECLINED: 'Recusado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGE_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  DECLINED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-neutral-100 text-neutral-600',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
  SENT: 'bg-amber-100 text-amber-700',
  OPENED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-neutral-100 text-neutral-500',
};

function statusIcon(status: string) {
  switch (status) {
    case 'CONFIRMED': return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    case 'DECLINED': return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    case 'EXPIRED': return <AlertCircle className="w-3.5 h-3.5 text-neutral-400" />;
    case 'OPENED': return <Eye className="w-3.5 h-3.5 text-blue-500" />;
    case 'SENT': return <Send className="w-3.5 h-3.5 text-amber-500" />;
    default: return <Clock className="w-3.5 h-3.5 text-neutral-400" />;
  }
}

const PAGE_SIZE = 20;

export default function InviteManagementTable({ periodId, grade, periodEndDate }: InviteManagementTableProps) {
  const [page, setPage] = useState(1);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState('');

  const { data, isLoading } = useReEnrollmentInvites(periodId, {
    status: undefined,
    gateStatus: undefined,
  });
  const resendMutation = useResendInvite();
  const cancelMutation = useCancelInvite();
  const extendMutation = useExtendDeadline();

  const allInvites = data?.data ?? [];
  const filtered = grade
    ? allInvites.filter((inv) => inv.student?.grade === grade)
    : allInvites;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const canManage = (status: string) =>
    !['CONFIRMED', 'DECLINED', 'CANCELLED'].includes(status);

  const handleExtendSubmit = (inviteId: string) => {
    if (!extendDate) return;
    extendMutation.mutate(
      { id: inviteId, newDeadline: new Date(extendDate).toISOString() },
      {
        onSuccess: () => {
          setExtendingId(null);
          setExtendDate('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        Nenhum convite encontrado{grade ? ` para a série ${grade}` : ''}.
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Aluno</th>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Série</th>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Data de Envio</th>
              <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Prazo</th>
              <th className="text-right px-4 py-2.5 font-medium text-neutral-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginated.map((inv) => (
              <tr key={inv.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 font-medium text-neutral-900">
                  {inv.student?.fullName || '—'}
                  <span className="ml-2 text-xs text-neutral-400 font-mono">{inv.student?.code}</span>
                </td>
                <td className="px-4 py-2.5 text-neutral-600">{inv.student?.grade || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE_COLORS[inv.status] || 'bg-neutral-100 text-neutral-500'}`}>
                    {statusIcon(inv.status)}
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-neutral-500">
                  {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-2.5">
                  {(() => {
                    const isTerminal = ['CONFIRMED', 'DECLINED', 'CANCELLED'].includes(inv.status);
                    if (isTerminal) {
                      return <span className="text-xs text-neutral-400">--</span>;
                    }
                    const effectiveDeadline = inv.extendedDeadline
                      ? new Date(inv.extendedDeadline)
                      : periodEndDate ? new Date(periodEndDate) : null;
                    if (!effectiveDeadline) {
                      return <span className="text-xs text-neutral-400">--</span>;
                    }
                    const daysRemaining = differenceInDays(effectiveDeadline, new Date());
                    const isOverdue = daysRemaining < 0;
                    const isToday = daysRemaining === 0;
                    const isUrgent = daysRemaining > 0 && daysRemaining <= 7;
                    return (
                      <div>
                        <div className="text-xs text-neutral-700">
                          {effectiveDeadline.toLocaleDateString('pt-BR')}
                        </div>
                        {isToday ? (
                          <span className="text-xs text-amber-600 font-semibold">Vence hoje</span>
                        ) : isOverdue ? (
                          <span className="text-xs text-red-600 font-semibold">
                            Vencido há {Math.abs(daysRemaining)} dia{Math.abs(daysRemaining) !== 1 ? 's' : ''}
                          </span>
                        ) : isUrgent ? (
                          <span className="text-xs text-amber-600">
                            {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-500">
                            {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canManage(inv.status) && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => resendMutation.mutate(inv.id)}
                        disabled={resendMutation.isPending}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-md hover:bg-cyan-50 disabled:opacity-50 transition-colors"
                        title="Reenviar"
                      >
                        <Send className="w-3 h-3" />
                        Reenviar
                      </button>

                      {confirmCancel === inv.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              cancelMutation.mutate(inv.id, { onSuccess: () => setConfirmCancel(null) });
                            }}
                            disabled={cancelMutation.isPending}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmCancel(null)}
                            className="px-2 py-1 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmCancel(inv.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                          title="Cancelar"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancelar
                        </button>
                      )}

                      {extendingId === inv.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="datetime-local"
                            value={extendDate}
                            onChange={(e) => setExtendDate(e.target.value)}
                            className="px-2 py-1 text-xs border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => handleExtendSubmit(inv.id)}
                            disabled={extendMutation.isPending || !extendDate}
                            className="px-2 py-1 text-xs font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:opacity-50"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setExtendingId(null); setExtendDate(''); }}
                            className="px-2 py-1 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExtendingId(inv.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-700 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
                          title="Estender Prazo"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          Estender Prazo
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
          <span>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
