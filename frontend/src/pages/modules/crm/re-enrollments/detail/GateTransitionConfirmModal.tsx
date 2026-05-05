import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  TRANSITION_LABELS,
  TRANSITION_DESCRIPTIONS,
  getTransitionVariant,
  getTransitionPrerequisite,
  type ReEnrollmentGateStatus,
} from '@/lib/re-enrollment-transitions';

interface GateTransitionConfirmModalProps {
  open: boolean;
  from: ReEnrollmentGateStatus;
  to: ReEnrollmentGateStatus;
  onConfirm: () => void;
  onClose: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
}

const GATE_LABELS: Record<ReEnrollmentGateStatus, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Documentos Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Taxa Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

/**
 * Confirmation modal for a gate transition. Narrates the change
 * ("Formulário Confirmado → Documentos Aprovados"), surfaces the
 * backend prerequisite that may block it, and routes the confirm
 * button through a variant-aware tone (danger for RECUSADO, success
 * for REMATRICULADO, primary for the happy-path advances).
 *
 * Kept generic and free of data-fetching so callers — the detail
 * page header and the Kanban card menu — share the exact same
 * confirmation UX.
 */
export function GateTransitionConfirmModal({
  open,
  from,
  to,
  onConfirm,
  onClose,
  isPending = false,
  errorMessage,
}: GateTransitionConfirmModalProps) {
  const variant = getTransitionVariant(to);
  const prereq = getTransitionPrerequisite(to);
  const label = TRANSITION_LABELS[to];
  const description = TRANSITION_DESCRIPTIONS[to];
  const isTerminal = to === 'REMATRICULADO' || to === 'RECUSADO';

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : variant === 'success'
        ? 'bg-emerald-600 hover:bg-emerald-700'
        : 'bg-primary-600 hover:bg-primary-700';

  const headerIcon =
    variant === 'danger' ? (
      <XCircle className="w-5 h-5 text-red-500" />
    ) : variant === 'success' ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    ) : (
      <AlertTriangle className="w-5 h-5 text-amber-500" />
    );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-transition-title"
          >
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0">{headerIcon}</div>
                <div className="flex-1">
                  <h3
                    id="gate-transition-title"
                    className="text-lg font-semibold text-neutral-900"
                  >
                    {label}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    <span className="font-medium">{GATE_LABELS[from]}</span>
                    <span className="mx-1.5 text-neutral-400">→</span>
                    <span className="font-medium">{GATE_LABELS[to]}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-neutral-600 mb-3">{description}</p>

              {prereq && (
                <div className="mb-3 p-2.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600">
                  <span className="font-semibold">Pré-requisito: </span>
                  {prereq}
                </div>
              )}

              {isTerminal && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                  Esta é uma ação terminal e não pode ser desfeita.
                </div>
              )}

              {errorMessage && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <span className="font-semibold">Erro do servidor: </span>
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isPending}
                  className={`px-3 py-1.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1.5 ${confirmClasses}`}
                >
                  {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Confirmar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
