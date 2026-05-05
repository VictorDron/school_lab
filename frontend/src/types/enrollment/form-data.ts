import type { EnrollmentFormStatus } from './enums';
import type { HealthData, EmergencyContact, HealthPlan, LeadChildHealth } from './health';
import type { TransportData } from './transport';
import type { FinancialResponsible } from './financial';
import type { EnrollmentDocument } from './documents';

// Enrollment info
export interface EnrollmentInfo {
  academicCalendar?: string;
  campus?: string;
  course?: string;
  module?: string;
  classGroup?: string;
  personType?: string;
  studentCpf?: string;
  studentIdNumber?: string;
  studentIdIssueDate?: string;
  studentIdIssuer?: string;
  termsAccepted?: boolean;
}

// Student & parent data
export interface StudentData {
  id?: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  desiredGrade?: string;
  currentGrade?: string;
  primaryLanguage?: string;
}

export interface ParentData {
  fullName: string;
  email?: string;
  phone?: string;
  cpf?: string;
  occupation?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuer?: string;
  dateOfBirth?: string;
  education?: string;
  religion?: string;
  address?: {
    zipCode?: string;
    country?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    street?: string;
    number?: string;
    complement?: string;
  };
  sameAddressAsOtherParent?: boolean;
}

export interface AddressData {
  country: string;
  state?: string;
  city: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

// Per-child enrollment prefill data
export interface StudentPrefillData extends StudentData {
  additionalInfo?: {
    hasHealthIssues: boolean;
    healthIssuesDetails?: string;
  } | null;
  enrollmentInfo?: EnrollmentInfo | null;
  childHealth?: LeadChildHealth | null;
}

// Pre-populated data from admission form (Form 1)
export interface EnrollmentPrefilledData {
  leadCode: string;
  familyName: string;
  student: StudentData | null;
  students?: StudentPrefillData[];
  father: ParentData | null;
  mother: ParentData | null;
  address: AddressData | null;
  additionalInfo: {
    hasHealthIssues: boolean;
    healthIssuesDetails?: string;
  } | null;
  enrollmentInfo: EnrollmentInfo | null;
  childHealth: LeadChildHealth | null;
  emergencyContacts: EmergencyContact[];
  healthPlan: HealthPlan | null;
  transport: TransportData | null;
  financialResponsible: FinancialResponsible | null;
  documents: EnrollmentDocument[];
  tokenExpires?: string;
  enrollmentStatus: EnrollmentFormStatus;
  isAlreadySubmitted?: boolean;
}

// Per-child enrollment data for multi-child support
export interface ChildEnrollmentFormData {
  childId: string;
  enrollmentInfo?: EnrollmentInfo;
  health?: HealthData;
  transport?: TransportData;
}

// Parent updates data (shared between father/mother)
export interface ParentUpdates {
  email?: string;
  phone?: string;
  cpf?: string;
  occupation?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuer?: string;
  dateOfBirth?: string;
  education?: string;
  religion?: string;
  address?: {
    zipCode?: string;
    country?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    street?: string;
    number?: string;
    complement?: string;
  };
  sameAddressAsOtherParent?: boolean;
}

// Form submission data
export interface EnrollmentFormData {
  enrollmentToken: string;
  enrollmentInfo: EnrollmentInfo;
  student?: {
    desiredGrade?: string;
  };
  childrenData?: ChildEnrollmentFormData[];
  fatherUpdates?: ParentUpdates;
  motherUpdates?: ParentUpdates;
  health: HealthData;
  emergencyContacts: EmergencyContact[];
  healthPlan: HealthPlan;
  transport: TransportData;
  financialResponsible: FinancialResponsible;
  termsAccepted: boolean;
}

// Token status
export interface EnrollmentTokenStatus {
  hasToken: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  wasSubmitted: boolean;
  submittedAt: string | null;
  submissionCount: number;
  admissionCompleted: boolean;
}

export interface EnrollmentLinkResponse {
  enrollmentLink: string;
  token: string;
  expiresAt: string;
  expiryHours: number;
}

// Enrollment form step configuration
export interface EnrollmentStep {
  id: number;
  key: string;
  labelPt: string;
  labelEn: string;
  icon: string;
}

export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  { id: 1, key: 'student', labelPt: 'Aluno', labelEn: 'Student', icon: 'User' },
  { id: 2, key: 'health', labelPt: 'Saúde', labelEn: 'Health', icon: 'Heart' },
  { id: 3, key: 'transport', labelPt: 'Transporte', labelEn: 'Transport', icon: 'Car' },
  { id: 4, key: 'financial', labelPt: 'Financeiro', labelEn: 'Financial', icon: 'CreditCard' },
  { id: 5, key: 'documents', labelPt: 'Documentos', labelEn: 'Documents', icon: 'FileUp' },
  { id: 6, key: 'terms', labelPt: 'Termos', labelEn: 'Terms', icon: 'FileCheck' },
];
