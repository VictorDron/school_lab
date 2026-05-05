import { motion } from 'framer-motion';
import { FileText, Download, Trash2, Eye, ExternalLink, User, ClipboardCheck, AlertTriangle } from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import { type UnifiedDocument, formatFileSize, isImageFile, getDocumentTypeInfo, getStatusLabel, getStatusColor } from './utils';

interface DocumentListProps {
  documents: UnifiedDocument[];
  children: LeadChild[];
  onPreview: (doc: UnifiedDocument) => void;
  onDelete: (doc: UnifiedDocument) => void;
  onReview?: (doc: UnifiedDocument) => void;
  canEdit: boolean;
}

function getSourceBadge(doc: UnifiedDocument) {
  if (doc.source === 'ENROLLMENT') {
    return { label: 'Matrícula', className: 'bg-emerald-100 text-emerald-700' };
  }
  const via = doc.uploadedVia || '';
  if (via === 'PUBLIC_FORM') {
    return { label: 'Formulário', className: 'bg-blue-100 text-blue-700' };
  }
  if (via === 'CRM') {
    return { label: 'CRM', className: 'bg-purple-100 text-purple-700' };
  }
  return { label: 'Upload', className: 'bg-neutral-100 text-neutral-600' };
}

export function DocumentList({ documents, children, onPreview, onDelete, onReview, canEdit }: DocumentListProps) {
  const getChildName = (childId?: string | null) => {
    if (!childId) return null;
    const child = children.find((c) => c.id === childId);
    return child?.fullName?.split(' ')[0] || null;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
        <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
        <p className="text-neutral-600 font-medium">Nenhum documento enviado</p>
        <p className="text-sm text-neutral-400 mt-1">
          Documentos enviados pela família ou pela equipe aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, index) => {
        const docType = getDocumentTypeInfo(doc.type);
        const Icon = docType.icon;
        const isImage = isImageFile(doc.name);
        const source = getSourceBadge(doc);
        const childName = getChildName(doc.childId);
        const isEnrollment = doc.source === 'ENROLLMENT';
        const canReview = isEnrollment && canEdit && onReview;

        return (
          <motion.div
            key={`${doc.source}-${doc.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group bg-white border border-neutral-200 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3 p-3">
              {/* Thumbnail / Icon */}
              {isImage ? (
                <div
                  className="w-11 h-11 rounded-lg bg-cover bg-center flex-shrink-0 cursor-pointer border border-neutral-200 hover:ring-2 hover:ring-primary-300 transition-all"
                  style={{ backgroundImage: `url(${doc.url})` }}
                  onClick={() => onPreview(doc)}
                />
              ) : (
                <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900 truncate">{doc.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${source.className}`}>
                    {source.label}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-neutral-100 text-neutral-600">
                    {doc.typeLabel}
                  </span>
                  {doc.status && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${getStatusColor(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  )}
                  {childName && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-50 text-indigo-700">
                      <User className="w-2.5 h-2.5" />
                      {childName}
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400">
                    {formatFileSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage && (
                  <button
                    onClick={() => onPreview(doc)}
                    className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4 text-neutral-500" />
                  </button>
                )}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-500" />
                </a>
                <a
                  href={doc.url}
                  download={doc.name}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-neutral-500" />
                </a>
                {canReview && (
                  <button
                    onClick={() => onReview(doc)}
                    className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Revisar documento"
                  >
                    <ClipboardCheck className="w-4 h-4 text-blue-500" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => onDelete(doc)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Rejection reason callout */}
            {doc.status === 'REJECTED' && doc.rejectionReason && (
              <div className="mx-3 mb-3 p-2 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{doc.rejectionReason}</p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
