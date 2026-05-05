export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'CANCELLED';

export interface Student {
  id: string;
  code: string;
  leadId: string;
  leadChildId: string;
  fullName: string;
  dateOfBirth: string | null;
  cpf: string | null;
  gender: string | null;
  nationality: string | null;
  grade: string | null;
  academicYear: number;
  status: StudentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string | null;
  alerts?: {
    pendingDocs: boolean;
    contractExpiring: boolean;
    reEnrollmentPending: boolean;
  };
}

export interface StudentHistory {
  id: string;
  studentId: string;
  action: string;
  details: Record<string, unknown> | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface StudentDetail {
  student: Student & { history: StudentHistory[] };
  documents: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    type: string;
    uploadedAt: string;
  }>;
  enrollmentDocuments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    documentType: string;
    uploadedAt: string;
  }>;
  emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
    email: string | null;
    relationship: string | null;
    isPrimary: boolean;
  }>;
  healthData: {
    weight: string | null;
    height: string | null;
    bloodType: string | null;
    medicalConditions: string[];
    medicalConditionsNotes: string | null;
    allergies: string[];
    allergiesNotes: string | null;
    feverMedications: string[];
    feverMedicationOther: string | null;
    painMedications: string[];
    painMedicationOther: string | null;
    medicationRestrictions: string | null;
    regularMedications: string | null;
    hasHospitalizations: boolean;
    hospitalizationsNotes: string | null;
    hasSeizures: boolean;
    seizuresNotes: string | null;
    hasEatingDisorder: boolean;
    eatingDisorderNotes: string | null;
    additionalHealthInfo: string | null;
  } | null;
  transportData: {
    transportMethod: string;
    transportMethodOther: string | null;
    schoolBusCompany: string | null;
    schoolBusContactName: string | null;
    schoolBusContactPhone: string | null;
    schoolBusContactEmail: string | null;
    canLeaveAlone: boolean;
    hasLegalRestrictions: boolean;
    legalRestrictionsNotes: string | null;
    allowThirdPartyPickup: boolean;
    authorizedPersons: unknown;
  } | null;
  enrollmentInfo: {
    course: string | null;
    module: string | null;
    classGroup: string | null;
    campus: string | null;
    academicCalendar: string | null;
    studentCpf: string | null;
    studentIdNumber: string | null;
  } | null;
  healthPlan: {
    operator: string;
    beneficiaryCode: string;
    planType: string;
    preferredHospital: string;
  } | null;
  parents: Array<{
    id: string;
    fullName: string;
    parentType: string;
    phone: string | null;
    email: string | null;
  }>;
}

export interface StudentFilters {
  search?: string;
  grade?: string;
  academicYear?: number;
  status?: StudentStatus;
  page?: number;
  limit?: number;
  parentName?: string;
  enrolledAfter?: string;
  enrolledBefore?: string;
  ageMin?: number;
  ageMax?: number;
  sortBy?: 'fullName' | 'grade' | 'enrolledAt' | 'status' | 'academicYear';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateStudentData {
  fullName?: string;
  grade?: string;
  academicYear?: number;
  dateOfBirth?: string | null;
  cpf?: string | null;
  gender?: string | null;
  nationality?: string | null;
}

export interface StudentDashboardStats {
  total: number;
  byStatus: Array<{ status: string; _count: { id: number } }>;
  byGrade: Array<{ grade: string | null; _count: { id: number } }>;
  byAcademicYear: Array<{ academicYear: number; _count: { id: number } }>;
}

export interface StudentEvolutionStats {
  monthly: Array<{ month: string; count: number }>;
  yearOverYear: Array<{ year: number; total: number }>;
  evasionRate: number;
}
