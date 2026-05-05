export interface HealthData {
  weight?: string;
  height?: string;
  bloodType?: string;
  medicalConditions: string[];
  medicalConditionsNotes?: string;
  hasHospitalizations: boolean;
  hospitalizationsNotes?: string;
  hasSeizures: boolean;
  seizuresNotes?: string;
  allergies: string[];
  allergiesNotes?: string;
  feverMedications: string[];
  feverMedicationOther?: string;
  painMedications: string[];
  painMedicationOther?: string;
  medicationRestrictions?: string;
  regularMedications?: string;
  hasEatingDisorder: boolean;
  eatingDisorderNotes?: string;
  additionalHealthInfo?: string;
}

export interface EmergencyContactData {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  isPrimary: boolean;
}

export interface HealthPlanData {
  operator: string;
  beneficiaryCode: string;
  planType: string;
  preferredHospital: string;
}

export interface VehicleData {
  model: string;
  color: string;
  plate: string;
}

export interface AuthorizedPersonData {
  name: string;
  dateOfBirth: string;
  cpf: string;
  email: string;
  bond?: string;
  relationship?: string; // Legacy
  vehicle?: VehicleData;
}

export interface TransportData {
  dropoffPickupPersons: string[];
  dropoffPickupOther?: string; // Legacy
  transportMethod: string;
  transportMethodOther?: string;
  familyVehicles?: VehicleData[];
  canLeaveAlone: boolean;
  isAthlete: boolean;
  athleteSchedule?: Record<string, { lateEntry?: string; earlyExit?: string }>;
  athleteNotes?: string;
  hasLegalRestrictions: boolean;
  legalRestrictionsNotes?: string;
  authorizedPersons?: AuthorizedPersonData[];
  // Legacy fields
  schoolBusCompany?: string;
  schoolBusContactName?: string;
  schoolBusContactPhone?: string;
  schoolBusContactEmail?: string;
  allowThirdPartyPickup?: boolean;
}

export interface FinancialResponsibleData {
  responsibleType: 'FATHER' | 'MOTHER' | 'OTHER';
  relationship?: string;
  personType?: string;
  // Pessoa Fisica
  fullName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  // Pessoa Juridica
  companyName?: string;
  cnpj?: string;
  tradeName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    country?: string;
    state?: string;
    city?: string;
    neighborhood?: string;
    street?: string;
    number?: string;
    complement?: string;
    zipCode?: string;
  };
}

export interface EnrollmentInfoData {
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
}

export interface EnrollmentDocumentData {
  documentType: string;
  category: string;
  childId?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  includesOtherDocs?: string[];
}

// Per-child enrollment data
export interface ChildEnrollmentData {
  childId: string;
  desiredGrade?: string;
  enrollmentInfo?: EnrollmentInfoData;
  health?: HealthData;
  transport?: TransportData;
}

// Parent updates type (shared)
export interface ParentUpdatesData {
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
  nationality?: string;
  maritalStatus?: string;
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

export interface PublicEnrollmentData {
  enrollmentToken: string;

  // General info (Step 1) - legacy: shared for single student
  enrollmentInfo?: EnrollmentInfoData;

  // Student data updates (Step 2) - mostly locked, but some editable
  studentUpdates?: {
    nationality?: string;
    cpf?: string;
    idNumber?: string;
    idIssueDate?: string;
    idIssuer?: string;
  };
  student?: {
    desiredGrade?: string;
  };

  // Per-child data (multi-child support)
  childrenData?: ChildEnrollmentData[];

  // Parent data updates (editable fields only) - shared
  fatherUpdates?: ParentUpdatesData;
  motherUpdates?: ParentUpdatesData;

  // Health data (Step 3) - legacy: shared for single student
  health?: HealthData;
  emergencyContacts?: EmergencyContactData[];
  healthPlan?: HealthPlanData;

  // Transport data (Step 4) - shared
  transport?: TransportData;

  // Financial responsible (Step 5) - shared
  financialResponsible?: FinancialResponsibleData;

  // Documents (Step 6) - handled separately via upload endpoint
  documents?: EnrollmentDocumentData[];

  // Terms (Step 7) - shared
  termsAccepted: boolean;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}
