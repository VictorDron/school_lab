import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { type UnifiedDocument, getStatusLabel, getStatusColor } from './utils';

interface ReviewDocumentModalProps {
  document: UnifiedDocument | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}

export function ReviewDocumentModal({
  document,
  onClose,
  onApprove,
  onReject,
  isLoading,
}: ReviewDocumentModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [mode, setMode] = useState<'choose' | 'reject'>('choose');

  const handleClose = () => {
    setRejectionReason('');
    setMode('choose');
    onClose();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(rejectionReason.trim());
    setRejectionReason('');
    setMode('choose');
  };

  return (
    <AnimatePresence>
      {document && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white rounded-xl p-5 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Document info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-neutral-900 truncate">{document.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-neutral-500">{document.typeLabel}</span>
                  {document.status && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(document.status)}`}>
                      {getStatusLabel(document.status)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {mode === 'choose' ? (
              <>
                <p className="text-sm text-neutral-600 mb-4">
                  Deseja aprovar ou rejeitar este documento de matrícula?
                </p>
                <div className="flex gap-2">
                  <button onClick={handleClose} className="btn btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button
                    onClick={() => setMode('reject')}
                    className="btn bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 flex-1 flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                  <button
                    onClick={onApprove}
                    disabled={isLoading}
                    className="btn bg-green-600 text-white hover:bg-green-700 flex-1 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Motivo da rejeição *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Descreva o motivo da rejeição..."
                    className="input w-full h-24 resize-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMode('choose')} className="btn btn-secondary flex-1">
                    Voltar
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isLoading || !rejectionReason.trim()}
                    className="btn bg-red-600 text-white hover:bg-red-700 flex-1 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Confirmar Rejeição
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
