import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, CheckCircle2, Clock, User } from 'lucide-react';
import { useResolveEscalation } from '@/hooks/useEscalations';
import { DepartmentBadge } from '../gates/DepartmentBadge';
import type { CriticalIssueEscalation } from '@/types/contract';

interface EscalationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: CriticalIssueEscalation | null;
  canResolve: boolean;
}

const severityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Baixa', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Média', color: 'bg-amber-100 text-amber-800' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  CRITICAL: { label: 'Crítica', color: 'bg-red-100 text-red-800' },
};

const gateStepLabels: Record<string, string> = {
  FORM_APPROVED: 'Formulário',
  VISIT_APPROVED: 'Visita',
  EVALUATION_COMPLETED: 'Avaliação',
  APPROVED: 'Aprovação',
  CONTRACT_PENDING: 'Contrato',
  FINANCIAL_APPROVED: 'Financeiro',
  ENROLLED: 'Matrícula',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EscalationDetailModal({ isOpen, onClose, escalation, canResolve }: EscalationDetailModalProps) {
  const resolveMutation = useResolveEscalation();
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset resolution notes when modal opens with a new escalation
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes('');
    }
  }, [isOpen, escalation?.id]);

  const handleResolve = () => {
    if (!escalation) return;

    resolveMutation.mutate(
      { id: escalation.id, leadId: escalation.leadId, notes: resolutionNotes.trim() },
      {
        onSuccess: () => {
          setResolutionNotes('');
          onClose();
        },
      },
    );
  };

  if (!escalation) return null;

  const severityCfg = severityConfig[escalation.severity] ?? { label: escalation.severity, color: 'bg-gray-100 text-gray-800' };
  const gateLabel = gateStepLabels[escalation.gateStep] ?? escalation.gateStep;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-600 to-red-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Detalhes da Escalação</h2>
                    <p className="text-sm text-white/70">
                      {escalation.lead?.familyName ?? `Lead ${escalation.leadId.slice(0, 8)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-11rem)]">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${severityCfg.color}`}>
                    {severityCfg.label}
                  </span>
                  <DepartmentBadge department={escalation.department} />
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                    {gateLabel}
                  </span>
                  {escalation.isResolved ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Resolvida
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pendente
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 mb-1">Descrição</h3>
                  <p className="text-sm text-neutral-600 whitespace-pre-wrap bg-neutral-50 rounded-lg p-3">
                    {escalation.description}
                  </p>
                </div>

                {/* Raised by */}
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Registrada por:</span>{' '}
                      {escalation.raisedBy?.displayName ?? 'Desconhecido'}
                    </p>
                    <p className="text-xs text-neutral-500">{formatDate(escalation.createdAt)}</p>
                  </div>
                </div>

                {/* Resolved info */}
                {escalation.isResolved && (
                  <div className="border-t border-neutral-100 pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Resolução
                    </h3>

                    {escalation.resolutionNotes && (
                      <p className="text-sm text-neutral-600 whitespace-pre-wrap bg-green-50 rounded-lg p-3">
                        {escalation.resolutionNotes}
                      </p>
                    )}

                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-neutral-700">
                          <span className="font-medium">Resolvida por:</span>{' '}
                          {escalation.resolvedBy?.displayName ?? 'Desconhecido'}
                        </p>
                        {escalation.resolvedAt && (
                          <p className="text-xs text-neutral-500">{formatDate(escalation.resolvedAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Resolve form */}
                {!escalation.isResolved && canResolve && (
                  <div className="border-t border-neutral-100 pt-4 space-y-3">
                    <h3 className="text-sm font-semibold text-neutral-700">Resolver Escalação</h3>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                      placeholder="Notas sobre a resolução..."
                      className="input resize-none"
                    />
                    <button
                      onClick={handleResolve}
                      disabled={resolveMutation.isPending}
                      className="btn btn-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 w-full"
                    >
                      {resolveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Resolvendo...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Resolver Escalação
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary btn-md"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
