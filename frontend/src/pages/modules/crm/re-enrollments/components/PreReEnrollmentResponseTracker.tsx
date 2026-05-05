import { useState, useMemo } from 'react';
import { Users, Loader2, Link2, RotateCcw, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  usePreReEnrollmentResponses,
  useResendPreReEnrollmentEmail,
} from '@/hooks/usePreReEnrollment';
import NegotiationModal from './NegotiationModal';
import type {
  PreReEnrollmentResponse,
  PreReEnrollmentResponseStatus,
} from '@/types/pre-reenrollment';

interface PreReEnrollmentResponseTrackerProps {
  periodId: string;
  isLocked: boolean;
}

const STATUS_CONFIG: Record<
  PreReEnrollmentResponseStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Sem resposta', className: 'bg-neutral-100 text-neutral-600' },
  AGREED: { label: 'Concordou', className: 'bg-emerald-100 text-emerald-700' },
  DISAGREED: { label: 'Discordou', className: 'bg-red-100 text-red-700' },
  NEGOTIATING: { label: 'Em negociação', className: 'bg-amber-100 text-amber-700' },
  NEGOTIATED: { label: 'Negociado', className: 'bg-blue-100 text-blue-700' },
};

type FilterKey = 'ALL' | PreReEnrollmentResponseStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'AGREED', label: 'Concordaram' },
  { key: 'DISAGREED', label: 'Discordaram' },
  { key: 'PENDING', label: 'Sem Resposta' },
  { key: 'NEGOTIATING', label: 'Em Negociação' },
  { key: 'NEGOTIATED', label: 'Negociado' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function PreReEnrollmentResponseTracker({
  periodId,
  isLocked,
}: PreReEnrollmentResponseTrackerProps) {
  const { data, isLoading } = usePreReEnrollmentResponses(periodId);
  const resendMutation = useResendPreReEnrollmentEmail(periodId);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [negotiationTarget, setNegotiationTarget] =
    useState<PreReEnrollmentResponse | null>(null);

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/public/pre-reenrollment/${token}`;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success('Link copiado!'))
      .catch(() => toast.error('Erro ao copiar link.'));
  };

  const responses = data?.data || [];

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return responses;
    return responses.filter((r) => r.status === activeFilter);
  }, [responses, activeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-violet-50">
          <Users className="w-4 h-4 text-violet-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">Respostas das Famílias</h3>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
              activeFilter === f.key
                ? 'bg-cyan-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {responses.length === 0 ? (
        <p className="text-xs text-neutral-400 py-6 text-center">
          Nenhum e-mail de pré-rematrícula enviado ainda.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-neutral-400 py-6 text-center">
          Nenhuma resposta com este filtro.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-200">
                <th className="pb-2 pr-3">Aluno</th>
                <th className="pb-2 pr-3">Série</th>
                <th className="pb-2 pr-3">E-mail</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Data Resposta</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((response) => {
                const cfg = STATUS_CONFIG[response.status] || STATUS_CONFIG.PENDING;
                return (
                  <tr
                    key={response.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="py-2 pr-3">
                      <span className="font-medium text-neutral-900">
                        {response.student.fullName}
                      </span>
                      <span className="ml-1 text-neutral-400">
                        {response.student.studentCode}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-neutral-600">
                      {response.student.grade || '—'}
                    </td>
                    <td className="py-2 pr-3 text-neutral-600">{response.emailTo || '—'}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-neutral-600">
                      {formatDate(response.respondedAt)}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        {/* Copy link */}
                        <button
                          onClick={() => handleCopyLink(response.token)}
                          title="Copiar link"
                          className="p-1.5 rounded-md hover:bg-neutral-100 text-emerald-600 transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Resend email */}
                        {!isLocked && response.status === 'PENDING' && (
                          <button
                            onClick={() => resendMutation.mutate(response.id)}
                            disabled={resendMutation.isPending}
                            title="Reenviar e-mail"
                            className="p-1.5 rounded-md hover:bg-neutral-100 text-blue-600 transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Negotiate */}
                        {!isLocked && response.status === 'DISAGREED' && (
                          <button
                            onClick={() => setNegotiationTarget(response)}
                            className="px-2 py-1 text-[10px] font-medium text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                          >
                            Negociar
                          </button>
                        )}

                        {/* Next step: send re-enrollment invite */}
                        {!isLocked && (response.status === 'AGREED' || response.status === 'NEGOTIATED') && (
                          <button
                            onClick={() => {
                              toast.success('Família pronta para receber convite de rematrícula. Acesse a aba "Alunos Elegíveis" para enviar.');
                            }}
                            title="Próximo passo: enviar convite de rematrícula"
                            className="px-2 py-1 text-[10px] font-medium text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Enviar Convite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Negotiation modal */}
      {negotiationTarget && (
        <NegotiationModal
          isOpen={!!negotiationTarget}
          onClose={() => setNegotiationTarget(null)}
          response={negotiationTarget}
          periodId={periodId}
        />
      )}
    </div>
  );
}
