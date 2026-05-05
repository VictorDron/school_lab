export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const EMAIL_THROTTLE_MS = 600;
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const DEPARTMENT_LABELS: Record<string, string> = {
  ADMISSIONS: 'Admissões',
  PSYCHOLOGY: 'Psicologia',
  HEALTH: 'Saúde',
  SECRETARIAT: 'Secretaria',
  COORDINATION: 'Coordenação',
  FINANCE: 'Financeiro',
  LEGAL: 'Jurídico',
  DIRECTOR: 'Diretoria',
};

export const GATE_STEP_LABELS: Record<string, string> = {
  NOT_STARTED: 'Não Iniciado',
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
  EVALUATION_COMPLETED: 'Avaliação Completa',
  APPROVED: 'Aprovado',
  ENROLLMENT_PENDING: 'Matrícula Pendente',
  ENROLLMENT_COMPLETED: 'Matrícula Completa',
  CONTRACT_PENDING: 'Contrato Pendente',
  CONTRACT_SIGNED: 'Contrato Assinado',
  FINANCIAL_APPROVED: 'Financeiro Aprovado',
  ENROLLED: 'Matriculado',
  REJECTED: 'Rejeitado',
};
