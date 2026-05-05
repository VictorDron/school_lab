import { format, parseISO } from 'date-fns';
import { DOC_TYPE_LABELS } from './constants';
import type { DocumentRecord } from './types';

export function formatDocType(type: string): string {
  return DOC_TYPE_LABELS[type] ?? type;
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return '—';
  }
}

export function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImage(mimeType: string | undefined): boolean {
  return !!mimeType?.startsWith('image/');
}

export function canPreview(mimeType: string | undefined): boolean {
  return !!mimeType && (mimeType.startsWith('image/') || mimeType === 'application/pdf');
}

/**
 * Merge admission and enrollment document arrays into one normalized list.
 * Admission docs use field aliases (name, url, type, size); enrollment
 * docs already match the target shape.
 */
export function unifyDocuments(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: Array<Record<string, any>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentDocuments: Array<Record<string, any>>,
): DocumentRecord[] {
  const admissionDocs: DocumentRecord[] = documents.map((d) => ({
    id: d.id,
    fileName: d.name || d.fileName,
    fileUrl: d.url || d.fileUrl,
    documentType: d.type || 'OTHER',
    category: 'ADMISSION',
    status: 'APPROVED',
    rejectionReason: null,
    fileSize: d.size || d.fileSize,
    mimeType: d.mimeType,
    uploadedAt: d.uploadedAt,
    reviewedAt: null,
    source: 'admission' as const,
  }));

  const enrollDocs: DocumentRecord[] = enrollmentDocuments.map((d) => ({
    id: d.id,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    documentType: d.documentType || 'OTHER',
    category: d.category || 'STUDENT',
    status: d.status || 'PENDING',
    rejectionReason: d.rejectionReason,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    uploadedAt: d.uploadedAt,
    reviewedAt: d.reviewedAt,
    source: 'enrollment' as const,
  }));

  return [...admissionDocs, ...enrollDocs];
}
