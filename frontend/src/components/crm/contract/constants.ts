import type { ContractStatus, ContractSignerRole } from '@/types/contract';

export interface FeeRow {
  faixa: string;
  anuidade: number;
  entrada: number;
}

export interface NewSigner {
  name: string;
  email: string;
  role: ContractSignerRole;
}

export const statusConfig: Record<ContractStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  PENDING_LEGAL: { label: 'Aguard. Jurídico', color: 'bg-amber-100 text-amber-800' },
  PENDING_FINANCIAL: { label: 'Aguard. Financeiro', color: 'bg-orange-100 text-orange-800' },
  SENT: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  SIGNED: { label: 'Assinado', color: 'bg-green-100 text-green-800' },
  ACTIVE: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export const approvalBadge: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  CONDITIONAL: { label: 'Condicional', color: 'bg-yellow-100 text-yellow-800' },
  ESCALATED: { label: 'Escalado', color: 'bg-purple-100 text-purple-800' },
};

export const signerRoleOptions: { value: ContractSignerRole; label: string }[] = [
  { value: 'PARENT', label: 'Responsável' },
  { value: 'GUARDIAN', label: 'Tutor' },
  { value: 'SCHOOL_REPRESENTATIVE', label: 'Repr. Escola' },
  { value: 'WITNESS', label: 'Testemunha' },
];
