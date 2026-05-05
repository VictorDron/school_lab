import { CheckCircle, Clock, XCircle, type LucideIcon } from 'lucide-react';

export const DOCUMENT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'OTHER', label: 'Outro' },
  { value: 'STUDENT_ID', label: 'RG do Aluno' },
  { value: 'STUDENT_CPF', label: 'CPF do Aluno' },
  { value: 'BIRTH_CERTIFICATE', label: 'Certidão de Nascimento' },
  { value: 'VACCINATION_CARD', label: 'Carteira de Vacinação' },
  { value: 'HEALTH_PLAN_CARD', label: 'Carteirinha do Plano' },
  { value: 'STUDENT_PHOTO', label: 'Foto 3x4 do Aluno' },
  { value: 'MEDICAL_REPORT', label: 'Laudo Médico' },
  { value: 'MOTHER_ID', label: 'RG da Mãe' },
  { value: 'MOTHER_CPF', label: 'CPF da Mãe' },
  { value: 'MOTHER_RESIDENCE', label: 'Comprovante de Residência (Mãe)' },
  { value: 'FATHER_ID', label: 'RG do Pai' },
  { value: 'FATHER_CPF', label: 'CPF do Pai' },
  { value: 'FATHER_RESIDENCE', label: 'Comprovante de Residência (Pai)' },
  { value: 'SCHOOL_DECLARATION', label: 'Declaração de Escolaridade' },
  { value: 'FINANCIAL_CLEARANCE', label: 'Declaração de Quitação Financeira' },
  { value: 'SCHOOL_TRANSCRIPT', label: 'Histórico Escolar' },
];

export const DOC_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  PENDING: {
    label: 'Pendente',
    color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Aprovado',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: XCircle,
  },
};
