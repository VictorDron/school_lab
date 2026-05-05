import type { AdmissionGateStatus, EvaluationDecision } from './approvals';

// CRM Event types
export type CrmEventType = 'VISIT' | 'VIVENCIA';
export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type VivenciaStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface CrmEvent {
  id: string;
  leadId: string;
  eventType: CrmEventType;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  color?: string;
  visitStatus?: VisitStatus;
  visitNotes?: string;
  visitCompletedAt?: string;
  vivenciaStatus?: VivenciaStatus;
  vivenciaNotes?: string;
  vivenciaCompletedAt?: string;
  assignedTeacherId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  lead?: { id: string; code: string; familyName: string; primaryContactName: string; admissionGateStatus?: AdmissionGateStatus; children?: { id: string; fullName: string; desiredGrade?: string }[] };
  createdBy?: { id: string; displayName: string };
  assignedTeacher?: { id: string; displayName: string };
  evaluations?: ExperienceEvaluation[];
  _count?: { evaluations: number };
}

export interface ExperienceEvaluation {
  id: string;
  eventId: string;
  childId: string;
  leadId: string;
  teacherName: string;
  evaluatedById: string;
  evaluationDate: string;
  behavior?: string;
  english?: string;
  interactionWithKids?: string;
  mathPlacement?: string;
  englishPlacement?: string;
  additionalNotes?: string;
  decision: EvaluationDecision;
  decisionById?: string;
  decisionAt?: string;
  decisionNotes?: string;
  lastEditedById?: string;
  lastEditedAt?: string;
  createdAt: string;
  updatedAt: string;
  event?: { id: string; title: string; eventType: CrmEventType; startDate: string };
  child?: { id: string; fullName: string; desiredGrade?: string };
  lead?: { id: string; code: string; familyName: string };
  evaluatedBy?: { id: string; displayName: string };
  decisionBy?: { id: string; displayName: string };
  lastEditedBy?: { id: string; displayName: string };
}
