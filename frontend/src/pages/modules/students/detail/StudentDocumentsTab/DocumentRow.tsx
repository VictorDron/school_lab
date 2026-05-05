import {
  AlertTriangle,
  ClipboardCheck,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from 'lucide-react';
import { SourceBadge, StatusBadge } from './badges';
import { canPreview, formatDate, formatDocType, formatFileSize, isImage } from './helpers';
import type { DocumentRecord } from './types';

interface DocumentRowProps {
  doc: DocumentRecord;
  onPreview: (doc: DocumentRecord) => void;
  onReview: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
  onEditType: (doc: DocumentRecord) => void;
}

export function DocumentRow({
  doc,
  onPreview,
  onReview,
  onDelete,
  onEditType,
}: DocumentRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-shadow group">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center">
        {isImage(doc.mimeType) ? (
          <img src={doc.fileUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-5 h-5 text-neutral-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{doc.fileName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <SourceBadge source={doc.source} />
          <span className="text-xs text-neutral-500">{formatDocType(doc.documentType)}</span>
          <StatusBadge status={doc.status ?? 'PENDING'} />
          {doc.fileSize ? (
            <span className="text-xs text-neutral-400">{formatFileSize(doc.fileSize)}</span>
          ) : null}
          <span className="text-xs text-neutral-400">{formatDate(doc.uploadedAt)}</span>
        </div>
        {doc.status === 'REJECTED' && doc.rejectionReason && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{doc.rejectionReason}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {canPreview(doc.mimeType) && (
          <button
            onClick={() => onPreview(doc)}
            title="Visualizar"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => window.open(doc.fileUrl, '_blank')}
          title="Abrir em nova aba"
          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <a
          href={doc.fileUrl}
          download={doc.fileName}
          title="Download"
          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
        {doc.source === 'enrollment' && (
          <>
            <button
              onClick={() => onEditType(doc)}
              title="Alterar tipo"
              className="p-1.5 text-neutral-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReview(doc)}
              title="Revisar"
              className="p-1.5 text-neutral-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(doc)}
          title="Excluir"
          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
