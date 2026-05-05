import { File } from 'lucide-react';
import { allDocumentTypes, DocumentTypeDefinition, enrollmentDocTypeLabels } from './constants';
import type { LeadDocument } from '@/types/crm';
import type { EnrollmentDocument } from '@/types/enrollment';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function isImageFile(name: string): boolean {
  const ext = name.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
}

export function getDocumentTypeInfo(type: string): DocumentTypeDefinition {
  return (
    allDocumentTypes.find((t) => t.value === type) || {
      value: type,
      label: type,
      icon: File,
      perChild: false,
      required: false,
    }
  );
}

// ==================== UNIFIED DOCUMENT ====================

export interface UnifiedDocument {
  id: string;
  leadId: string;
  name: string;
  type: string;
  typeLabel: string;
  url: string;
  size: number;
  uploadedAt: string;
  source: 'ADMISSION' | 'ENROLLMENT';
  childId?: string | null;
  status?: string;
  category?: string;
  mimeType?: string;
  rejectionReason?: string;
  uploadedBy?: string;
  uploadedVia?: string;
}

export function normalizeLeadDocument(doc: LeadDocument): UnifiedDocument {
  return {
    id: doc.id,
    leadId: doc.leadId,
    name: doc.name,
    type: doc.type,
    typeLabel: getDocumentTypeInfo(doc.type).label,
    url: doc.url,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    source: 'ADMISSION',
    childId: doc.childId,
    uploadedBy: doc.uploadedBy,
    uploadedVia: doc.uploadedVia,
  };
}

export function normalizeEnrollmentDocument(doc: EnrollmentDocument): UnifiedDocument {
  return {
    id: doc.id,
    leadId: doc.leadId,
    name: doc.fileName,
    type: doc.documentType,
    typeLabel: enrollmentDocTypeLabels[doc.documentType] || doc.documentType,
    url: doc.fileUrl,
    size: doc.fileSize,
    uploadedAt: doc.uploadedAt,
    source: 'ENROLLMENT',
    childId: doc.childId,
    status: doc.status,
    category: doc.category,
    mimeType: doc.mimeType,
    rejectionReason: doc.rejectionReason,
  };
}

export function mergeDocuments(
  leadDocs: LeadDocument[],
  enrollmentDocs: EnrollmentDocument[]
): UnifiedDocument[] {
  const unified = [
    ...leadDocs.map(normalizeLeadDocument),
    ...enrollmentDocs.map(normalizeEnrollmentDocument),
  ];
  return unified.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function getStatusLabel(status?: string): string {
  switch (status) {
    case 'APPROVED': return 'Aprovado';
    case 'REJECTED': return 'Rejeitado';
    case 'PENDING': return 'Pendente';
    default: return '';
  }
}

export function getStatusColor(status?: string): string {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700';
    case 'REJECTED': return 'bg-red-100 text-red-700';
    case 'PENDING': return 'bg-amber-100 text-amber-700';
    default: return 'bg-neutral-100 text-neutral-600';
  }
}
