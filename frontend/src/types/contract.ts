export type AdmissionDepartment = 'ADMISSIONS' | 'PSYCHOLOGY' | 'HEALTH' | 'SECRETARIAT' | 'COORDINATION' | 'FINANCE' | 'LEGAL' | 'DIRECTOR';

export type GateApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL' | 'ESCALATED';

export type ContractStatus = 'DRAFT' | 'PENDING_LEGAL' | 'PENDING_FINANCIAL' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'CANCELLED';

export type ContractSignerRole = 'PARENT' | 'GUARDIAN' | 'SCHOOL_REPRESENTATIVE' | 'WITNESS';

export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type FinancialAnalysisStatus = 'PENDING' | 'IN_ANALYSIS' | 'APPROVED' | 'REJECTED';

export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AdmissionGateApproval {
  id: string;
  leadId: string;
  gateStep: string;
  department: AdmissionDepartment;
  decision: GateApprovalDecision;
  decidedById?: string;
  notes?: string;
  isRequired: boolean;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
  decidedBy?: { id: string; displayName: string };
}

export interface GateStepConfig {
  id: string;
  gateStep: string;
  department: AdmissionDepartment;
  isRequired: boolean;
  approvalOrder: number;
  allowedRoles: string[];
  description?: string;
}

export interface PipelinePhaseStatus {
  name: string;
  steps: string[];
  stepsCompleted: number;
  totalSteps: number;
  percentage: number;
  isCurrent: boolean;
  approvals: Record<string, AdmissionGateApproval[]>;
}

export interface PipelineStatus {
  leadId: string;
  familyName: string;
  currentStatus: string;
  phases: PipelinePhaseStatus[];
}

export interface Contract {
  id: string;
  leadId: string;
  code: string;
  status: ContractStatus;
  enrollmentType?: 'FIRST' | 'RENEWAL';
  templateVersion?: string;
  totalAnnualValue?: number;
  installments?: number;
  discountPercent?: number;
  enrollmentFee?: number;
  documentUrl?: string;
  signedDocumentUrl?: string;
  clicksignEnvelopeId?: string;
  clicksignStatus?: string;
  clicksignEnvelopeUrl?: string;
  legalApprovalStatus?: GateApprovalDecision;
  legalApprovedById?: string;
  legalApprovedAt?: string;
  legalNotes?: string;
  financialApprovalStatus?: GateApprovalDecision;
  financialApprovedById?: string;
  financialApprovedAt?: string;
  financialNotes?: string;
  sentAt?: string;
  signedAt?: string;
  activatedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  signers?: ContractSigner[];
  payments?: ContractPayment[];
  lead?: { id: string; familyName: string };
  legalApprovedBy?: { id: string; displayName: string };
  financialApprovedBy?: { id: string; displayName: string };
}

export interface ContractSigner {
  id: string;
  contractId: string;
  role: ContractSignerRole;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  clicksignSignerId?: string;
  hasSigned: boolean;
  signedAt?: string;
  refusedAt?: string;
  refusalReason?: string;
}

export interface ContractPayment {
  id: string;
  contractId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
  boletoUrl?: string;
  paidAt?: string;
}

export interface FinancialAnalysis {
  id: string;
  leadId: string;
  cpfAnalyzed?: string;
  cpfStatus?: string;
  analysisNotes?: string;
  negotiationNotes?: string;
  status: FinancialAnalysisStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CriticalIssueEscalation {
  id: string;
  leadId: string;
  childId?: string;
  raisedById: string;
  department: AdmissionDepartment;
  gateStep: string;
  description: string;
  severity: EscalationSeverity;
  isResolved: boolean;
  resolvedById?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
  lead?: { id: string; code: string; familyName: string };
  raisedBy?: { id: string; displayName: string };
  resolvedBy?: { id: string; displayName: string };
}

// Addendum types (Phase 14 - ADIT-01)
export type AddendumType = 'DISCOUNT' | 'SPECIAL_CONDITION' | 'GRADE_CHANGE' | 'OTHER';
export type AddendumStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'CANCELLED';

export interface AddendumSigner {
  id: string;
  addendumId: string;
  role: ContractSignerRole;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  clicksignSignerId?: string;
  clicksignAuthMethod?: string;
  hasSigned: boolean;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractAddendum {
  id: string;
  contractId: string;
  code: string;
  type: AddendumType;
  status: AddendumStatus;
  description: string;
  changedValues?: Array<{ field: string; oldValue: string; newValue: string }>;
  documentUrl?: string;
  signedDocumentUrl?: string;
  clicksignEnvelopeId?: string;
  clicksignStatus?: string;
  clicksignEnvelopeUrl?: string;
  createdAt: string;
  updatedAt: string;
  signedAt?: string;
  signers: AddendumSigner[];
}

export const ADDENDUM_TYPE_LABELS: Record<AddendumType, string> = {
  DISCOUNT: 'Desconto',
  SPECIAL_CONDITION: 'Condição especial',
  GRADE_CHANGE: 'Alteração de série',
  OTHER: 'Outro',
};

export const ADDENDUM_STATUS_LABELS: Record<AddendumStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING_SIGNATURE: 'Aguardando assinatura',
  SIGNED: 'Assinado',
  CANCELLED: 'Cancelado',
};
