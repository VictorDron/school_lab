import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MoreVertical,
  Link2,
  Ban,
  CalendarPlus,
  Send,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  useResendInvite,
  useCancelInvite,
  useExtendDeadline,
} from '@/hooks/useReEnrollmentDashboard';
import { useRegenerateInviteLink } from '@/hooks/useReEnrollmentInvite';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';
import { ReEnrollmentPipelineStrip } from './ReEnrollmentPipelineStrip';
import type { ReEnrollmentGateStatus } from './ReEnrollmentPipelineStrip';
import { InviteGateActions } from './InviteGateActions';

interface ReEnrollmentInviteHeaderProps {
  detail: InviteDetail;
}

/**
 * Top band of the invite detail page. Neutral actions only
 * (resend / regenerate link / extend deadline / cancel) — gate
 * transitions land here in Phase 5 as a sibling button group.
 *
 * The pipeline strip sits below the action row so the user always
 * knows where this invite is in the campaign without scrolling.
 */
export function ReEnrollmentInviteHeader({ detail }: ReEnrollmentInviteHeaderProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [extendDate, setExtendDate] = useState('');

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT') || hasModuleAccess('STUDENT_MANAGEMENT', 'EDIT');

  const resendMutation = useResendInvite();
  const cancelMutation = useCancelInvite();
  const extendMutation = useExtendDeadline();
  const regenerateMutation = useRegenerateInviteLink();

  const { invite, student, period } = detail;
  const isTerminal =
    invite.gateStatus === 'REMATRICULADO' || invite.gateStatus === 'RECUSADO';

  const handleResend = () => {
    resendMutation.mutate(invite.id);
    setShowMenu(false);
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate(invite.id);
    setShowMenu(false);
  };

  const handleExtendConfirm = () => {
    if (!extendDate) return;
    extendMutation.mutate(
      { id: invite.id, newDeadline: new Date(extendDate).toISOString() },
      {
        onSuccess: () => {
          setShowExtendPrompt(false);
          setExtendDate('');
        },
      },
    );
  };

  const handleCancelConfirm = () => {
    cancelMutation.mutate(invite.id, {
      onSuccess: () => setShowCancelConfirm(false),
    });
  };

  return (
    <div className="flex-shrink-0 bg-white">
      {/* Row 1: nav + name + actions */}
      <div className="h-14 flex items-center justify-between px-3 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/crm/re-enrollments')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Rematrículas</span>
          </button>

          <div className="w-px h-6 bg-neutral-200 flex-shrink-0" />

          <h1 className="text-base sm:text-xl font-semibold text-neutral-900 truncate max-w-[160px] sm:max-w-md">
            {student.fullName}
          </h1>

          <span className="text-xs sm:text-sm font-mono text-neutral-400 flex-shrink-0 hidden sm:inline">
            {student.code}
          </span>

          {student.grade && (
            <span className="hidden sm:inline-flex text-[11px] font-medium bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">
              {student.grade}
            </span>
          )}
        </div>

        {canEdit && !isTerminal && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Ações"
            >
              <MoreVertical className="w-4 h-4 text-neutral-500" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                  <MenuItem
                    icon={<Send className="w-4 h-4" />}
                    label="Reenviar convite"
                    onClick={handleResend}
                    loading={resendMutation.isPending}
                  />
                  <MenuItem
                    icon={<Link2 className="w-4 h-4" />}
                    label="Regenerar link"
                    onClick={handleRegenerate}
                    loading={regenerateMutation.isPending}
                  />
                  <MenuItem
                    icon={<CalendarPlus className="w-4 h-4" />}
                    label="Estender prazo"
                    onClick={() => {
                      setShowMenu(false);
                      setShowExtendPrompt(true);
                    }}
                  />
                  <hr className="my-1 border-neutral-200" />
                  <MenuItem
                    icon={<Ban className="w-4 h-4" />}
                    label="Cancelar convite"
                    onClick={() => {
                      setShowMenu(false);
                      setShowCancelConfirm(true);
                    }}
                    danger
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Row 2: Gate transition actions — only when editable and non-terminal */}
      {canEdit && !isTerminal && (
        <div className="px-3 sm:px-6 py-2 bg-white border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mr-1">
              Avançar:
            </span>
            <InviteGateActions
              inviteId={invite.id}
              currentGate={invite.gateStatus as ReEnrollmentGateStatus}
            />
          </div>
        </div>
      )}

      {/* Row 3: Pipeline strip */}
      <ReEnrollmentPipelineStrip status={invite.gateStatus as ReEnrollmentGateStatus} />

      {/* Row 3: Campaign + deadline context */}
      <div className="px-3 sm:px-6 py-1.5 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
        <span className="text-xs text-neutral-500">
          Campanha:{' '}
          <span className="font-medium text-neutral-700">{period.name}</span>
        </span>
        <span className="text-xs text-neutral-500">
          Prazo:{' '}
          <span className="font-medium text-neutral-700">
            {new Date(detail.effectiveDeadline).toLocaleDateString('pt-BR')}
          </span>
          {invite.extendedDeadline && (
            <span className="ml-1.5 text-[10px] text-amber-600 font-medium">
              (estendido)
            </span>
          )}
        </span>
      </div>

      {/* Extend deadline modal */}
      <AnimatePresence>
        {showExtendPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowExtendPrompt(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Estender prazo
                </h3>
                <p className="text-sm text-neutral-600 mb-3">
                  Novo prazo individual para este convite. Ignora o prazo padrão do
                  período.
                </p>
                <input
                  type="date"
                  value={extendDate}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowExtendPrompt(false)}
                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleExtendConfirm}
                    disabled={extendMutation.isPending || !extendDate}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {extendMutation.isPending && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowCancelConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Cancelar convite
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  O convite de <strong>{student.fullName}</strong> será marcado como
                  cancelado e removido do fluxo da campanha. Esta ação não pode ser
                  desfeita.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={cancelMutation.isPending}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {cancelMutation.isPending && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Cancelar convite
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  loading,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 disabled:opacity-50 ${
        danger ? 'hover:bg-red-50 text-red-600' : 'hover:bg-neutral-50'
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
