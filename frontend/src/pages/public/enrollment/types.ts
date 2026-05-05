/**
 * Page-local types for EnrollmentFormPage.
 *
 * These describe the UI form model — the shape that react-hook-form binds
 * to, with multi-child support overlaid on top of the per-child sections.
 * Domain types (HealthData, EnrollmentInfo, AuthorizedPerson, …) come from
 * `@/types/enrollment`.
 */

import type {
  EnrollmentInfo,
  HealthData,
  TransportData,
  AuthorizedPerson,
  EmergencyContact,
  HealthPlan,
  FinancialResponsible,
} from '@/types/enrollment';

/** Per-student enrollment form data, used when more than one child applies. */
export interface StudentEnrollmentData {
  childId?: string;
  desiredGrade: string;
  enrollmentInfo: EnrollmentInfo;
  health: HealthData;
  transport: TransportData;
  authorizedPersons: AuthorizedPerson[];
}

interface ParentAddress {
  zipCode?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
}

interface ParentUpdates {
  email: string;
  phone: string;
  cpf: string;
  occupation?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuer?: string;
  dateOfBirth?: string;
  education?: string;
  religion?: string;
  nationality?: string;
  maritalStatus?: string;
  address?: ParentAddress;
  sameAddressAsOtherParent?: boolean;
}

export interface EnrollmentForm {
  enrollmentInfo: EnrollmentInfo;
  student: { desiredGrade: string };
  // Multi-child support
  studentsEnrollment: StudentEnrollmentData[];
  fatherUpdates: ParentUpdates;
  motherUpdates: ParentUpdates;
  health: HealthData;
  emergencyContacts: EmergencyContact[];
  healthPlan: HealthPlan;
  transport: TransportData;
  financialResponsible: FinancialResponsible;
  authorizedPersons: AuthorizedPerson[];
  termsAccepted: boolean;
}
