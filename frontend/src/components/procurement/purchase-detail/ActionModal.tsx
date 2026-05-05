import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Send,
} from 'lucide-react';
import type { ActionModalType } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActionModalProps {
  type: ActionModalType;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  isPending: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActionModal({ type, onClose, onConfirm, isPending }: ActionModalProps) {
  const [comments, setComments] = useState('');

  if (!type) return null;

  const isReject = type === 'reject';
  const isCancel = type === 'cancel';
  const isSubmit = type === 'submit';
  const isApprove = type === 'approve';

  const title = isApprove
    ? 'Aprovar Requisição'
    : isReject
      ? 'Rejeitar Requisição'
      : isSubmit
        ? 'Submeter para Aprovação'
        : 'Cancelar Requisição';

  const description = isApprove
    ? 'Deseja aprovar esta requisição de compra? Você pode adicionar um comentário opcional.'
    : isReject
      ? 'Informe o motivo da rejeição. Este campo é obrigatório.'
      : isSubmit
        ? 'Tem certeza que deseja submeter esta requisição para aprovação?'
        : 'Informe o motivo do cancelamento. Este campo é obrigatório.';

  const confirmLabel = isApprove
    ? 'Aprovar'
    : isReject
      ? 'Rejeitar'
      : isSubmit
        ? 'Submeter'
        : 'Cancelar Requisição';

  const confirmColor = isApprove
    ? 'btn btn-primary btn-md'
    : isReject || isCancel
      ? 'btn btn-md bg-red-600 text-white hover:bg-red-700'
      : 'btn btn-primary btn-md';

  const requiresComment = isReject || isCancel;
  const showCommentField = isApprove || isReject || isCancel;
  const canConfirm = !requiresComment || comments.trim().length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-3 mb-4">
            {(isReject || isCancel) && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            )}
            {isApprove && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
            {isSubmit && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
              <p className="text-sm text-neutral-600 mt-1">{description}</p>
            </div>
          </div>

          {showCommentField && (
            <div className="mb-4">
              <label className="label">
                {requiresComment ? 'Motivo *' : 'Comentário (opcional)'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="input w-full mt-1"
                rows={3}
                placeholder={
                  requiresComment
                    ? 'Informe o motivo...'
                    : 'Adicione um comentário...'
                }
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={isPending}
            >
              Voltar
            </button>
            <button
              onClick={() => onConfirm(comments)}
              disabled={isPending || !canConfirm}
              className={confirmColor}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
