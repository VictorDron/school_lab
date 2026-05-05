import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { getErrorMessage } from '@/lib/api';
import { useUpdateStudentDocumentType } from '@/hooks/useStudents';
import { DOCUMENT_TYPE_OPTIONS } from '../constants';
import type { DocumentRecord } from '../types';

interface EditTypeModalProps {
  doc: DocumentRecord;
  studentId: string;
  onClose: () => void;
}

export function EditTypeModal({ doc, studentId, onClose }: EditTypeModalProps) {
  const [docType, setDocType] = useState(doc.documentType);
  const updateMutation = useUpdateStudentDocumentType();

  const handleSave = useCallback(async () => {
    if (docType === doc.documentType) {
      onClose();
      return;
    }
    try {
      await updateMutation.mutateAsync({ studentId, docId: doc.id, documentType: docType });
      toast.success('Tipo do documento atualizado!');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [studentId, doc.id, docType, doc.documentType, updateMutation, onClose]);

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
          <h3 className="text-lg font-semibold text-neutral-900">Alterar Tipo</h3>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tipo de Documento
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            {DOCUMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
