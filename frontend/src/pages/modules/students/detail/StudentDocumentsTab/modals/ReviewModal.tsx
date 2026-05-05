import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, X, XCircle } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { useReviewStudentDocument } from '@/hooks/useStudents';
import { formatDocType } from '../helpers';
import type { DocumentRecord } from '../types';

interface ReviewModalProps {
  doc: DocumentRecord;
  studentId: string;
  onClose: () => void;
}

export function ReviewModal({ doc, studentId, onClose }: ReviewModalProps) {
  const [reason, setReason] = useState('');
  const reviewMutation = useReviewStudentDocument();

  const handleReview = useCallback(
    async (status: 'APPROVED' | 'REJECTED') => {
      if (status === 'REJECTED' && !reason.trim()) {
        toast.error('Informe o motivo da rejeição.');
        return;
      }
      try {
        await reviewMutation.mutateAsync({
          studentId,
          docId: doc.id,
          status,
          rejectionReason: status === 'REJECTED' ? reason : undefined,
        });
        toast.success(status === 'APPROVED' ? 'Documento aprovado!' : 'Documento rejeitado.');
        onClose();
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [studentId, doc.id, reason, reviewMutation, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Revisar Documento</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</p>
          <p className="text-xs text-neutral-500 mt-1">{formatDocType(doc.documentType)}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Motivo da rejeição (obrigatório se rejeitar)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex: Documento ilegível, fora da validade..."
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleReview('REJECTED')}
            disabled={reviewMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Rejeitar
          </button>
          <button
            onClick={() => handleReview('APPROVED')}
            disabled={reviewMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Aprovar
          </button>
        </div>
      </div>
    </div>
  );
}
