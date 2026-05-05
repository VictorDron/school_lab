import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useDecommissionAsset } from '@/hooks/useAssets';
import type { Asset } from '@/types/assets';

interface DecommissionModalProps {
  asset: Asset;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  MAINTENANCE: 'Manutenção',
  DECOMMISSIONED: 'Desativado',
};

export function DecommissionModal({ asset, onClose }: DecommissionModalProps) {
  const decommissionMutation = useDecommissionAsset();
  const [reason, setReason] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleConfirm = () => {
    decommissionMutation.mutate(
      { id: asset.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
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
      >
        <div
          className="bg-white rounded-xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-error-600 to-error-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Desativar Ativo</h2>
                <p className="text-sm text-white/70">Esta ação não pode ser desfeita</p>
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
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Asset Info */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-2 border border-neutral-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Ativo</span>
                <span className="text-sm font-medium text-neutral-800">{asset.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Código</span>
                <span className="text-sm font-mono text-neutral-800">{asset.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Status Atual</span>
                <span className="badge badge-neutral">
                  {statusLabels[asset.status] || asset.status}
                </span>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-800">
                  Ação irreversível
                </p>
                <p className="text-xs text-warning-600 mt-0.5">
                  Ao desativar este ativo, ele será marcado como fora de uso permanentemente e não
                  poderá ser reativado. O ativo continuará visível no histórico para fins de
                  auditoria.
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="label">Motivo (opcional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Informe o motivo da desativação..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={decommissionMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={decommissionMutation.isPending}
              className="btn btn-md bg-error-600 text-white hover:bg-error-700 focus:ring-error-500"
            >
              {decommissionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Desativando...
                </>
              ) : (
                'Confirmar Desativação'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
