// ====================== RE-ENROLLMENT FORM TYPES ======================

export interface ReEnrollmentInvite {
  id: string;
  token: string;
  status: string;
  periodId: string;
}

export interface ReEnrollmentPeriod {
  name: string;
  targetYear: number;
  endDate: string;
  eligibleGrades: string[];
}

export interface ReEnrollmentStudent {
  id: string;
  fullName: string;
  grade: string | null;
  dateOfBirth: string | null;
  code: string;
}

export interface ReEnrollmentChildHealth {
  id?: string;
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

export interface ReEnrollmentChildTransport {
  id?: string;
  transportMethod: string;
  transportMethodOther?: string;
  canLeaveAlone: boolean;
  isAthlete: boolean;
  schoolBusCompany?: string;
  schoolBusContactName?: string;
  schoolBusContactPhone?: string;
  schoolBusContactEmail?: string;
  hasLegalRestrictions: boolean;
  legalRestrictionsNotes?: string;
  allowThirdPartyPickup: boolean;
  authorizedPersons?: any;
  familyVehicles?: any;
  dropoffPickupPersons?: any;
  dropoffPickupOther?: string;
  athleteSchedule?: any;
  athleteNotes?: string;
}

export interface ReEnrollmentEmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface ReEnrollmentFinancialResponsible {
  id?: string;
  responsibleType: string;
  relationship?: string;
  personType?: string;
  fullName?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  cnpj?: string;
  tradeName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

export interface ReEnrollmentHealthPlan {
  id?: string;
  operator: string;
  beneficiaryCode: string;
  planType: string;
  preferredHospital: string;
}

export interface ReEnrollmentPersonalData {
  child: any;
  parents: any[];
  address: any | null;
}

export interface ReEnrollmentEditableSections {
  health: ReEnrollmentChildHealth | null;
  transport: ReEnrollmentChildTransport | null;
  emergencyContacts: ReEnrollmentEmergencyContact[];
  financialResponsible: ReEnrollmentFinancialResponsible | null;
  healthPlan: ReEnrollmentHealthPlan | null;
}

export interface RequiredDocument {
  documentType: string;
  label: string;
  required: boolean;
  existingFileName: string | null;
  expiryDate: string | null;
  isValid: boolean;
  needsUpload: boolean;
}

export interface ReEnrollmentFinancialInfo {
  communicatedAnnualValue: number | null;
  communicatedAdjustmentPercent: number | null;
}

export interface ReEnrollmentParentUpdate {
  parentId: string;
  email: string;
  phone?: string;
}

export interface ReEnrollmentAdditionalResponsible {
  fullName: string;
  email: string;
  phone?: string;
  relationship?: string;
}

export interface ReEnrollmentFormData {
  invite: ReEnrollmentInvite;
  period: ReEnrollmentPeriod;
  student: ReEnrollmentStudent;
  suggestedGrade: string | null;
  personalData: ReEnrollmentPersonalData;
  editableSections: ReEnrollmentEditableSections;
  requiredDocuments?: RequiredDocument[];
  financialInfo?: ReEnrollmentFinancialInfo | null;
}

export interface ReEnrollmentSubmitData {
  health?: Partial<ReEnrollmentChildHealth>;
  transport?: Partial<ReEnrollmentChildTransport>;
  emergencyContacts?: ReEnrollmentEmergencyContact[];
  financialResponsible?: Partial<ReEnrollmentFinancialResponsible>;
  healthPlan?: Partial<ReEnrollmentHealthPlan>;
  parentUpdates?: ReEnrollmentParentUpdate[];
  additionalResponsible?: ReEnrollmentAdditionalResponsible;
  lgpdConsent: true;
  correctionNotes?: string;
}

// ====================== ADMIN TYPES ======================

export type ReEnrollmentPeriodStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINALIZED';

export interface ReEnrollmentPeriodFull {
  id: string;
  name: string;
  targetYear: number;
  startDate: string;
  endDate: string;
  eligibleGrades: string[];
  status: ReEnrollmentPeriodStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { invites: number };
}

export interface CreatePeriodData {
  name: string;
  targetYear: number;
  startDate: string;
  endDate: string;
  eligibleGrades: string[];
}

export interface UpdatePeriodData {
  name?: string;
  targetYear?: number;
  startDate?: string;
  endDate?: string;
}

export interface EligibleStudent {
  id: string;
  fullName: string;
  grade: string | null;
  code: string;
  leadEmail: string | null;
  childName: string | null;
}

export interface BatchInviteResult {
  created: number;
  failed: number;
  alreadyInvited: number;
  total: number;
}

export interface RenewalContractSigner {
  id: string;
  name: string;
  email: string;
  role: string;
  hasSigned: boolean;
  signedAt: string | null;
}

export interface RenewalContract {
  id: string;
  code: string;
  status: string;
  clicksignStatus: string | null;
  sentAt: string | null;
  signedAt: string | null;
  documentUrl: string | null;
  signedDocumentUrl: string | null;
  signers: RenewalContractSigner[];
}

export interface ReEnrollmentInviteFull {
  id: string;
  token: string;
  status: string;
  gateStatus: string;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  openedAt: string | null;
  confirmedAt: string | null;
  extendedDeadline: string | null;
  student: {
    id: string;
    fullName: string;
    grade: string | null;
    code: string;
    leadId?: string;
    lead?: {
      id: string;
      contracts?: RenewalContract[];
    };
  };
  gate: {
    id: string;
    status: string;
  } | null;
}

export type ReEnrollmentGateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

export interface EnrollmentFeePayment {
  id: string;
  inviteId: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl: string | null;
  registeredById: string;
  createdAt: string;
}

// ====================== UNIFIED MANAGEMENT VIEW ======================

export interface UnifiedStudentRow {
  student: {
    id: string;
    fullName: string;
    grade: string | null;
    code: string;
    leadId: string | null;
    leadEmail: string | null;
    childName: string | null;
    lead: {
      id: string;
      contracts?: RenewalContract[];
    } | null;
  };
  invite: {
    id: string;
    token: string;
    status: string;
    gateStatus: string;
    notes: string | null;
    createdAt: string;
    sentAt: string | null;
    openedAt: string | null;
    confirmedAt: string | null;
    extendedDeadline: string | null;
  } | null;
}

export interface UnifiedManagementMeta {
  page: number;
  limit: number;
  total: number;
  totalStudents: number;
  totalInvited: number;
  awaiting: number;
}

// ====================== DASHBOARD TYPES ======================

export interface DashboardStats {
  statusCounts: Array<{ status: string; _count: { _all: number } }>;
  gateStatusCounts: Array<{ gateStatus: string; _count: { _all: number } }>;
  total: number;
  period: { id: string; name: string; startDate: string; endDate: string; status: string };
}

export interface TimelineMilestone {
  type: string;
  date: string;
  label: string;
}

export interface PeriodReport {
  confirmed: ReEnrollmentInviteFull[];
  declined: ReEnrollmentInviteFull[];
  expired: ReEnrollmentInviteFull[];
  nonResponded: ReEnrollmentInviteFull[];
  summary: { confirmed: number; declined: number; expired: number; nonResponded: number; total: number };
}

// ====================== FUNNEL & BOTTLENECK TYPES ======================

export interface FunnelStage {
  name: string;
  key: string;
  count: number;
  percentage: number;
  avgDaysInStage: number | null;
}

export interface FunnelData {
  stages: FunnelStage[];
  total: number;
}

export interface BottleneckStage {
  stageName: string;
  key: string;
  count: number;
  percentage: number;
  isBottleneck: boolean;
}

export interface OverdueInvite {
  inviteId: string;
  studentName: string;
  grade: string | null;
  currentStage: string;
  currentStageName: string;
  daysOverdue: number;
}

export interface BottleneckData {
  bottlenecks: BottleneckStage[];
  overdueInvites: OverdueInvite[];
}
