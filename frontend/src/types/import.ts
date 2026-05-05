export interface ParsedRow {
  rowNumber: number;
  studentName: string;
  course: string;
  module: string;
  classGroup: string;
  grade: string;
  raw: Record<string, string>;
  health: Record<string, unknown>;
  transport: Record<string, unknown>;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }>;
  healthPlan: Record<string, unknown>;
  enrollmentInfo: Record<string, unknown>;
}

export interface RowError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DuplicateMatch {
  rowNumber: number;
  studentName: string;
  matchType: 'CPF' | 'NAME_GRADE';
  existingStudentId: string;
  existingStudentName: string;
  existingGrade: string | null;
  action: 'skip' | 'update' | 'create';
}

export interface FamilyGroup {
  familyId: number;
  familyName: string;
  members: ParsedRow[];
  detectionMethod: 'EMERGENCY_CONTACT' | 'SURNAME' | 'SINGLE';
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  duplicates: number;
  familyGroups: number;
  estimatedStudents: number;
  estimatedFamilies: number;
}

export interface ImportPreviewResult {
  rows: ParsedRow[];
  errors: RowError[];
  duplicates: DuplicateMatch[];
  familyGroups: FamilyGroup[];
  summary: ImportSummary;
}

export interface ImportResult {
  importHistoryId: string;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: RowError[];
  createdStudentIds: string[];
}

export interface ImportHistory {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number | null;
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: RowError[] | null;
  createdStudentIds: string[] | null;
  status: string;
  createdAt: string;
}

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'confirm' | 'result' | 'documents';

export interface DocumentUploadResult {
  matched: Array<{
    folderName: string;
    fileName: string;
    matchedStudentId: string | null;
    matchScore: number;
  }>;
  unmatched: Array<{
    folderName: string;
    fileName: string;
  }>;
  uploadResult: {
    uploaded: number;
    skipped: number;
    failed: number;
    errors: Array<{ fileName: string; error: string }>;
  };
}

export type DuplicateAction = 'skip' | 'update' | 'create';
