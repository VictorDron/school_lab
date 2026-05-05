import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Ban } from 'lucide-react';
import type { GateApprovalDecision } from '@/types/contract';

interface ApprovalModalProps {
  type: 'legal' | 'financial';
  onClose: () => void;
  onSubmit: (decision: GateApprovalDecision, notes?: string) => void;
  isPending: boolean;
}

export function ApprovalModal({ type, onClose, onSubmit, isPending }: ApprovalModalProps) {
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
        <h4 className="text-sm font-semibold text-neutral-800">
          {type === 'legal' ? 'Parecer Juridico' : 'Parecer Financeiro'}
        </h4>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Observacoes (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit('REJECTED', notes || undefined)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Rejeitar
          </button>
          <button
            onClick={() => onSubmit('APPROVED', notes || undefined)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Aprovar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CancelModalProps {
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isPending: boolean;
}

export function CancelModal({ onClose, onConfirm, isPending }: CancelModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
        <h4 className="text-sm font-semibold text-neutral-800">Cancelar Contrato</h4>
        <p className="text-sm text-neutral-600">
          Tem certeza que deseja cancelar este contrato? Esta acao nao pode ser desfeita.
        </p>
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">
            Motivo (opcional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
