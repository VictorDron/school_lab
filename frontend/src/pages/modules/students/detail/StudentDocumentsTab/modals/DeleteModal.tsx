import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, X } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { useDeleteStudentDocument } from '@/hooks/useStudents';
import type { DocumentRecord } from '../types';

interface DeleteModalProps {
  doc: DocumentRecord;
  studentId: string;
  onClose: () => void;
}

export function DeleteModal({ doc, studentId, onClose }: DeleteModalProps) {
  const deleteMutation = useDeleteStudentDocument();

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync({ studentId, docId: doc.id });
      toast.success('Documento excluído.');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [studentId, doc.id, deleteMutation, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900">Excluir Documento</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-neutral-600">
          Tem certeza que deseja excluir{' '}
          <strong className="text-neutral-800">{doc.fileName}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
