import type { EnrollmentDocument } from '../enrollment';
import type { LeadDocument, LeadComment, LeadHistory } from './leads-data';
import type {
  LeadAddress, LeadParent, LeadAdditionalInfo, LeadEducationHistory,
  LeadChildHealth, LeadChildTransport, LeadEmergencyContact,
  LeadHealthPlan, LeadTransportData, LeadFinancialResponsible, LeadEnrollmentInfo,
} from './leads-relations';

// Lead type unions
export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'EVENT'
  | 'ADVERTISEMENT'
  | 'WALK_IN'
  | 'PHONE'
  | 'EMAIL'
  | 'OTHER';

export type CommentType = 'GENERAL' | 'POSITIVE' | 'CONCERN' | 'INTERNAL';

export type LeadOriginType = 'ADMIN_CREATED' | 'IMPORTED';
export type ApplicationStatus = 'PENDING' | 'LINK_SENT' | 'FORM_RECEIVED' | 'NOT_REQUIRED';
export type EnrollmentFormStatus = 'NOT_STARTED' | 'LINK_SENT' | 'FORM_RECEIVED';
export type DocumentRequestStatus = 'PENDING' | 'RECEIVED' | 'REJECTED' | 'WAIVED';
export type ParentType = 'FATHER' | 'MOTHER' | 'GUARDIAN';

export interface Lead {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  secondaryContactName?: string;
  secondaryContactEmail?: string;
  secondaryContactPhone?: string;
  columnId: string;
  source: LeadSource;
  numberOfChildren: number;
  desiredGrades: string[];
  hasSiblingsAtSchool?: boolean;
  notes?: string;
  isFlagged: boolean;
  applicationToken?: string;
  applicationTokenExpires?: string;
  applicationDate?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  originType?: LeadOriginType;
  applicationStatus?: ApplicationStatus;
  applicationSentAt?: string;
  lastFormSubmittedAt?: string;
  formSubmissionCount?: number;
  admissionGateStatus?: import('./approvals').AdmissionGateStatus;
  notificationPreference?: 'PRIMARY' | 'MOTHER' | 'FATHER' | 'BOTH';
  enrollmentToken?: string;
  enrollmentTokenExpires?: string;
  enrollmentStatus?: EnrollmentFormStatus;
  enrollmentSentAt?: string;
  enrollmentSubmittedAt?: string;
  enrollmentSubmissionCount?: number;
  column?: import('./contracts').KanbanColumn;
  children?: LeadChild[];
  documents?: LeadDocument[];
  enrollmentDocuments?: EnrollmentDocument[];
  comments?: LeadComment[];
  history?: LeadHistory[];
  creator?: { id: string; displayName: string };
  _count?: { documents: number; comments: number; enrollmentDocuments: number };
  address?: LeadAddress;
  parents?: LeadParent[];
  additionalInfo?: LeadAdditionalInfo;
  educationHistory?: LeadEducationHistory[];
  childrenHealth?: LeadChildHealth[];
  childrenTransport?: LeadChildTransport[];
  emergencyContacts?: LeadEmergencyContact[];
  healthPlan?: LeadHealthPlan;
  transport?: LeadTransportData;
  financialResponsible?: LeadFinancialResponsible;
  enrollmentInfo?: LeadEnrollmentInfo[];
  events?: import('./events').CrmEvent[];
  evaluations?: import('./events').ExperienceEvaluation[];
}

export interface LeadChild {
  id: string;
  leadId: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  desiredGrade?: string;
  currentGrade?: string;
  currentSchool?: string;
  specialNeeds?: string;
  primaryLanguage?: string;
  otherLanguages?: string[];
  studentType?: string;
  relationship: 'STUDENT' | 'SIBLING';
  isApplicant: boolean;
  createdAt: string;
  updatedAt: string;
}
