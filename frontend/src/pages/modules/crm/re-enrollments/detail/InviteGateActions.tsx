import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getValidNextStates,
  TRANSITION_LABELS,
  getTransitionVariant,
  type ReEnrollmentGateStatus,
} from '@/lib/re-enrollment-transitions';
import { useTransitionInviteGate } from '@/hooks/useReEnrollmentInvite';
import { getErrorMessage } from '@/lib/api';
import { GateTransitionConfirmModal } from './GateTransitionConfirmModal';

interface InviteGateActionsProps {
  inviteId: string;
  currentGate: ReEnrollmentGateStatus;
  /** Optional size hint — 'sm' for Kanban menu, 'md' for the detail header */
  size?: 'sm' | 'md';
  /** Optional callback invoked on successful transition, e.g. to close a host menu */
  onTransitioned?: (to: ReEnrollmentGateStatus) => void;
}

/**
 * Group of gate-advance buttons for a given invite. Renders only the
 * backend-valid next states for `currentGate`, each styled by
 * destination variant (success/danger/primary). Click opens the
 * shared GateTransitionConfirmModal; confirm fires the mutation and
 * surfaces server errors (e.g. DOCS_NOT_ALL_APPROVED) inline in the
 * modal rather than closing it.
 */
export function InviteGateActions({
  inviteId,
  currentGate,
  size = 'md',
  onTransitioned,
}: InviteGateActionsProps) {
  const nextStates = getValidNextStates(currentGate);
  const [pendingTo, setPendingTo] = useState<ReEnrollmentGateStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const transitionMutation = useTransitionInviteGate();

  if (nextStates.length === 0) return null;

  const handleConfirm = () => {
    if (!pendingTo) return;
    setErrorMessage(null);
    transitionMutation.mutate(
      { inviteId, gateStatus: pendingTo },
      {
        onSuccess: () => {
          const destination = pendingTo;
          toast.success(`Etapa atualizada: ${TRANSITION_LABELS[destination]}`);
          setPendingTo(null);
          onTransitioned?.(destination);
        },
        onError: (err) => {
          setErrorMessage(getErrorMessage(err));
        },
      },
    );
  };

  const handleClose = () => {
    setPendingTo(null);
    setErrorMessage(null);
  };

  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {nextStates.map((to) => {
          const variant = getTransitionVariant(to);
          const classes =
            variant === 'danger'
              ? 'bg-white text-red-700 border-red-200 hover:bg-red-50'
              : variant === 'success'
                ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                : 'bg-white text-primary-700 border-primary-200 hover:bg-primary-50';
          const icon =
            variant === 'danger' ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : variant === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5" />
            );
          return (
            <button
              key={to}
              type="button"
              onClick={() => setPendingTo(to)}
              className={`${padding} inline-flex items-center gap-1.5 font-medium rounded-md border transition-colors disabled:opacity-50 ${classes}`}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending && pendingTo === to ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                icon
              )}
              {TRANSITION_LABELS[to]}
            </button>
          );
        })}
      </div>

      {pendingTo && (
        <GateTransitionConfirmModal
          open
          from={currentGate}
          to={pendingTo}
          onConfirm={handleConfirm}
          onClose={handleClose}
          isPending={transitionMutation.isPending}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
}
