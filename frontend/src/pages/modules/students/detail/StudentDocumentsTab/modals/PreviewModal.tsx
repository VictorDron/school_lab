import { X } from 'lucide-react';
import type { DocumentRecord } from '../types';

interface PreviewModalProps {
  doc: DocumentRecord;
  onClose: () => void;
}

export function PreviewModal({ doc, onClose }: PreviewModalProps) {
  const isPdf = doc.mimeType === 'application/pdf';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <p className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</p>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center bg-neutral-100 min-h-[400px]">
          {isPdf ? (
            <iframe
              src={doc.fileUrl}
              className="w-full h-full min-h-[70vh]"
              title={doc.fileName}
            />
          ) : (
            <img
              src={doc.fileUrl}
              alt={doc.fileName}
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
