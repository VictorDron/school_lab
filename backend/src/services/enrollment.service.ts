// Shim: preserves import path for all consumers
// Actual implementation in ./enrollment/ directory
export * from './enrollment/index.js';

// Re-export types for backward compatibility (consumers may import types from here)
export type {
  HealthData,
  EmergencyContactData,
  HealthPlanData,
  VehicleData,
  AuthorizedPersonData,
  TransportData,
  FinancialResponsibleData,
  EnrollmentInfoData,
  EnrollmentDocumentData,
  ChildEnrollmentData,
  PublicEnrollmentData,
} from '../types/enrollment.types.js';
