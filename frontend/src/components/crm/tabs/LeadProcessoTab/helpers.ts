import type { ElementType } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export interface EventStatusConfig {
  label: string;
  icon: ElementType;
  className: string;
}

export const statusConfig: Record<string, EventStatusConfig> = {
  SCHEDULED: { label: 'Agendado', icon: Clock, className: 'text-yellow-700 bg-yellow-50' },
  IN_PROGRESS: { label: 'Em andamento', icon: Clock, className: 'text-blue-700 bg-blue-50' },
  COMPLETED: { label: 'Concluído', icon: CheckCircle, className: 'text-green-700 bg-green-50' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, className: 'text-red-700 bg-red-50' },
  NO_SHOW: { label: 'Não compareceu', icon: XCircle, className: 'text-neutral-700 bg-neutral-50' },
};

export const stepLabels: Record<string, string> = {
  NOT_STARTED: 'Início',
  FORM_RECEIVED: 'Formulário Recebido',
  FORM_APPROVED: 'Formulário Aprovado',
  VISIT_SCHEDULED: 'Visita Agendada',
  VISIT_COMPLETED: 'Visita Realizada',
  INTERVIEW_COMPLETED: 'Entrevista Realizada',
  VISIT_APPROVED: 'Visita Aprovada',
  DOCS_REQUESTED: 'Docs Solicitados',
  DOCS_RECEIVED: 'Docs Recebidos',
  VIVENCIA_SCHEDULED: 'Vivência Agendada',
  VIVENCIA_COMPLETED: 'Vivência Realizada',
  EVALUATION_PENDING: 'Avaliação Pendente',
  EVALUATION_COMPLETED: 'Avaliação Concluída',
  APPROVED: 'Aprovado',
  ENROLLMENT_PENDING: 'Matrícula Pendente',
  ENROLLMENT_COMPLETED: 'Matrícula Concluída',
  CONTRACT_PENDING: 'Contrato Pendente',
  CONTRACT_SIGNED: 'Contrato Assinado',
  FINANCIAL_APPROVED: 'Financeiro Aprovado',
};

export function buildApplicationLink(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${window.location.origin}/admissions/apply?token=${token}`;
}
