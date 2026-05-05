import type { ParentType } from './leads';

// Form submission data types (relations populated on Lead)

export interface LeadAddress {
  id: string;
  leadId: string;
  country: string;
  state?: string;
  city: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

export interface LeadParent {
  id: string;
  leadId: string;
  parentType: ParentType;
  fullName: string;
  email?: string;
  phone?: string;
  cpf?: string;
  occupation?: string;
  nativeLanguage?: string;
  nationality?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  idNumber?: string;
  idIssueDate?: string;
  idIssuer?: string;
  education?: string;
  religion?: string;
}

export interface LeadAdditionalInfo {
  id: string;
  leadId: string;
  hasPsychoEvaluation: boolean;
  psychoEvaluationDetails?: string;
  hasAcademicSupport: boolean;
  academicSupportDetails?: string;
  hasHealthIssues: boolean;
  healthIssuesDetails?: string;
  hasAdaptationDifficulty: boolean;
  adaptationDifficultyDetails?: string;
  otherRelevantInfo?: string;
}

export interface LeadEducationHistory {
  id: string;
  leadId: string;
  childId?: string;
  schoolName: string;
  country?: string;
  city?: string;
  gradesAttended?: string;
  yearStart?: number;
  yearEnd?: number;
  notes?: string;
  orderIndex: number;
}

export interface LeadChildHealth {
  id: string;
  leadId: string;
  childId: string;
  child?: { id: string; fullName: string };
  weight?: string;
  height?: string;
  bloodType?: string;
  medicalConditions?: string[];
  medicalConditionsNotes?: string;
  hasHospitalizations?: boolean;
  hospitalizationsNotes?: string;
  hasSeizures?: boolean;
  seizuresNotes?: string;
  allergies?: string[];
  allergiesNotes?: string;
  feverMedications?: string[];
  painMedications?: string[];
  medicationRestrictions?: string;
  regularMedications?: string;
  hasEatingDisorder?: boolean;
  eatingDisorderNotes?: string;
  additionalHealthInfo?: string;
}

export interface LeadChildTransport {
  id: string;
  leadId: string;
  childId: string;
  child?: { id: string; fullName: string };
  dropoffPickupPersons?: unknown;
  transportMethod?: string;
  canLeaveAlone?: boolean;
  isAthlete?: boolean;
}

export interface LeadEmergencyContact {
  id: string;
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  isPrimary: boolean;
}

export interface LeadHealthPlan {
  id: string;
  leadId: string;
  operator: string;
  beneficiaryCode: string;
  planType: string;
  preferredHospital: string;
}

export interface LeadTransportData {
  id: string;
  leadId: string;
  dropoffPickupPersons?: unknown;
  dropoffPickupOther?: string;
  transportMethod: string;
  transportMethodOther?: string;
  familyVehicles?: unknown;
  canLeaveAlone: boolean;
  isAthlete: boolean;
  schoolBusCompany?: string;
  schoolBusContactName?: string;
  schoolBusContactPhone?: string;
  hasLegalRestrictions: boolean;
  legalRestrictionsNotes?: string;
  allowThirdPartyPickup: boolean;
  authorizedPersons?: unknown;
}

export interface LeadFinancialResponsible {
  id: string;
  leadId: string;
  responsibleType: string;
  relationship?: string;
  personType?: string;
  fullName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  cnpj?: string;
}

export interface LeadEnrollmentInfo {
  id: string;
  leadId: string;
  childId?: string;
  child?: { id: string; fullName: string };
  academicCalendar?: string;
  campus?: string;
  course?: string;
  module?: string;
  classGroup?: string;
  personType?: string;
  studentCpf?: string;
  studentIdNumber?: string;
  studentIdIssuer?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
}
