// Master barrel — re-exports all type modules
// CRM types take precedence for EnrollmentFormStatus and LeadChildHealth.
// For enrollment-specific versions, import from '@/types/enrollment' directly.

export * from './crm';
export * from './enrollment/transport';
export * from './enrollment/financial';
export * from './enrollment/form-data';
export * from './enrollment/documents';
export * from './enrollment/constants';
// enrollment/enums: EnrollmentFormStatus conflicts with crm (same definition)
// enrollment/health: LeadChildHealth conflicts with crm (different shape)
// Re-export non-conflicting names from these modules:
export type {
  FinancialResponsibleType,
  FinancialPersonType,
  DocumentCategory,
  EnrollmentDocumentStatus,
} from './enrollment/enums';
export type {
  HealthData,
  EmergencyContact,
  HealthPlan,
} from './enrollment/health';
export * from './assets';
export * from './communication';
export * from './contract';
export * from './import';
export * from './pre-reenrollment';
export * from './procurement';
export * from './re-enrollment';
export * from './students';
