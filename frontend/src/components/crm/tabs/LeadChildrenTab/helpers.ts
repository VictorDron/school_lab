import { languages } from '@/constants/languages';

export const genderLabels: Record<string, string> = {
  M: 'Masculino',
  F: 'Feminino',
  O: 'Outro',
};

export interface StudentTypeBadge {
  label: string;
  color: string;
}

export const studentTypeLabels: Record<string, StudentTypeBadge> = {
  NEW: { label: 'Novo Aluno', color: 'bg-green-100 text-green-700' },
  RETURNING: { label: 'Aluno Retornando', color: 'bg-blue-100 text-blue-700' },
  CURRENT: { label: 'Aluno Atual', color: 'bg-purple-100 text-purple-700' },
};

export interface AgeParts {
  years: number;
  months: number;
}

export function calculateAge(dateOfBirth: string): AgeParts {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < birth.getDate()) {
    months--;
    if (months < 0) months += 12;
  }
  return { years, months };
}

export function formatAge(dateOfBirth: string): string {
  const { years, months } = calculateAge(dateOfBirth);
  if (years < 0 || (years === 0 && months < 0)) return '—';
  if (years === 0) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

export function langLabel(code: string): string {
  const lang = languages.find((l) => l.code === code);
  return lang ? lang.pt : code;
}
