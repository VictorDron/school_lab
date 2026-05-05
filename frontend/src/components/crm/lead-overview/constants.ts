import type { ParentType } from '@/types/crm';

export const parentTypeLabels: Record<ParentType, string> = {
  FATHER: 'Pai',
  MOTHER: 'Mae',
  GUARDIAN: 'Responsavel Legal',
};

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}
