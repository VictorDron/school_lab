// Column mapping configuration type
export interface ColumnMapping {
  csvIndex: number;
  csvHeaderEN: string;
  csvHeaderPT: string;
  targetModel:
    | 'LeadChild'
    | 'LeadChildHealth'
    | 'LeadChildTransport'
    | 'LeadEmergencyContact'
    | 'LeadHealthPlan'
    | 'LeadEnrollmentInfo'
    | 'Student'
    | 'SKIP';
  targetField: string;
  transform?: 'boolean' | 'list' | 'json' | 'number' | 'grade';
  required?: boolean;
  example?: string;
}

// Parsed row from CSV/XLSX
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

// Row-level validation error
export interface RowError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Duplicate match result
export interface DuplicateMatch {
  rowNumber: number;
  studentName: string;
  matchType: 'CPF' | 'NAME_GRADE';
  existingStudentId: string;
  existingStudentName: string;
  existingGrade: string | null;
  action: 'skip' | 'update' | 'create';
}

// Family group detected from CSV
export interface FamilyGroup {
  familyId: number;
  familyName: string;
  members: ParsedRow[];
  detectionMethod: 'EMERGENCY_CONTACT' | 'SURNAME' | 'SINGLE';
}

// Import summary for preview step
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

// Preview response (dry-run)
export interface ImportPreviewResult {
  rows: ParsedRow[];
  errors: RowError[];
  duplicates: DuplicateMatch[];
  familyGroups: FamilyGroup[];
  summary: ImportSummary;
}

// Confirm request body
export interface ImportConfirmRequest {
  rows: ParsedRow[];
  duplicateActions: Record<number, 'skip' | 'update' | 'create'>;
  familyGroups: FamilyGroup[];
}

// Import result after confirm
export interface ImportResult {
  importHistoryId: string;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: RowError[];
  createdStudentIds: string[];
}

// Grade mapping from CSV module values to system grades
export interface GradeMapping {
  csvValue: string;
  grade: string;
}
