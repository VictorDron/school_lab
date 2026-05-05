import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useLeadEscalations, useResolveEscalation } from '@/hooks/useEscalations';
import { useAuthStore } from '@/stores/authStore';
import { DepartmentBadge } from '../gates/DepartmentBadge';
import { EscalationDetailModal } from './EscalationDetailModal';
import type { CriticalIssueEscalation, EscalationSeverity } from '@/types/contract';

interface EscalationBannerProps {
  leadId: string;
}

const severityConfig: Record<EscalationSeverity, { bg: string; border: string; text: string }> = {
  CRITICAL: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  HIGH: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  MEDIUM: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
  LOW: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
};

const severityLabels: Record<EscalationSeverity, string> = {
  CRITICAL: 'Critico',
  HIGH: 'Alto',
  MEDIUM: 'Medio',
  LOW: 'Baixo',
};

export function EscalationBanner({ leadId }: EscalationBannerProps) {
  const { data: escalationsResponse } = useLeadEscalations(leadId);
  const escalations = escalationsResponse?.data || [];
  const { user } = useAuthStore();
  const resolveMutation = useResolveEscalation();

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState<CriticalIssueEscalation | null>(null);

  const canResolve = user?.role === 'ADMIN' || user?.role === 'DIRECTOR';

  const active = escalations.filter((e) => !e.isResolved);

  if (active.length === 0) return null;

  // Show the highest severity escalation first
  const severityOrder: EscalationSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const sorted = [...active].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  function handleResolve(id: string) {
    resolveMutation.mutate(
      { id, leadId, notes: resolveNotes.trim() },
      {
        onSuccess: () => {
          setResolvingId(null);
          setResolveNotes('');
        },
      },
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((escalation) => {
        const config = severityConfig[escalation.severity];
        const isResolving = resolvingId === escalation.id;

        return (
          <div
            key={escalation.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
          >
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.text}`} />
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedEscalation(escalation as CriticalIssueEscalation)}
                className="text-left w-full hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold uppercase ${config.text}`}>
                    {severityLabels[escalation.severity]}
                  </span>
                  <DepartmentBadge department={escalation.department} />
                </div>
                <p className={`text-sm ${config.text}`}>{escalation.description}</p>
                {escalation.raisedBy && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Reportado por {escalation.raisedBy.displayName} em{' '}
                    {new Date(escalation.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </button>

              {/* Resolve controls for ADMIN / DIRECTOR */}
              {canResolve && !isResolving && (
                <button
                  type="button"
                  onClick={() => setResolvingId(escalation.id)}
                  className="mt-2 px-3 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  Resolver
                </button>
              )}

              {isResolving && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={2}
                    placeholder="Notas de resolução..."
                    className="w-full text-sm border rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={resolveMutation.isPending}
                      onClick={() => handleResolve(escalation.id)}
                      className="px-3 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {resolveMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Confirmar Resolução'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResolvingId(null);
                        setResolveNotes('');
                      }}
                      className="px-3 py-1 text-xs font-medium rounded border text-neutral-600 hover:bg-white/50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <EscalationDetailModal
        isOpen={!!selectedEscalation}
        onClose={() => setSelectedEscalation(null)}
        escalation={selectedEscalation}
        canResolve={canResolve}
      />
    </div>
  );
}
