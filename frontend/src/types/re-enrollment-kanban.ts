import type { KanbanCardBase } from './kanban';

export type ReEnrollmentGateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

export type ReEnrollmentKanbanColumnKey =
  | 'CONVITE'
  | 'FORMULARIO'
  | 'DOCS'
  | 'CONTRATO'
  | 'PAGAMENTO'
  | 'CONCLUIDO'
  | 'RECUSADO';

export interface ReEnrollmentKanbanColumnCount {
  id: ReEnrollmentKanbanColumnKey;
  count: number;
}

export interface ReEnrollmentKanbanCard extends KanbanCardBase {
  columnId: ReEnrollmentKanbanColumnKey;
  studentName: string;
  grade: string | null;
  gateStatus: ReEnrollmentGateStatus;
  overdue: boolean;
  hasAction: boolean;
  lastUpdatedAt: string;
  /** ISO timestamp — extendedDeadline if set, else period.endDate. */
  effectiveDeadline: string;
}

export interface ReEnrollmentKanbanPayload {
  columns: ReEnrollmentKanbanColumnCount[];
  cards: ReEnrollmentKanbanCard[];
}
