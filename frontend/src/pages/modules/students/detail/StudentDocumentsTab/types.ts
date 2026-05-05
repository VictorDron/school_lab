export interface DocumentRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  category?: string;
  status?: string;
  rejectionReason?: string | null;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  reviewedAt?: string | null;
  source: 'admission' | 'enrollment';
}

export interface StudentDocumentsTabProps {
  studentId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documents: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentDocuments: Array<Record<string, any>>;
}

export type FilterTab = 'all' | 'admission' | 'enrollment';

export interface PendingFile {
  file: File;
  documentType: string;
  preview?: string;
}
