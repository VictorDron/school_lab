import type { Lead, ParentType } from '@/types/crm';

export const parentTypeLabels: Record<ParentType, string> = {
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  GUARDIAN: 'Responsável Legal',
};

export const ENROLLMENT_ELIGIBLE_STATUSES = [
  'APPROVED',
  'ENROLLMENT_PENDING',
  'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'FINANCIAL_APPROVED',
  'ENROLLED',
] as const;

export const preferenceOptions = [
  { value: 'PRIMARY', label: 'Padrao (contato principal)' },
  { value: 'MOTHER', label: 'Mae' },
  { value: 'FATHER', label: 'Pai' },
  { value: 'BOTH', label: 'Ambos' },
] as const;

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function buildApplicationLink(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${window.location.origin}/admissions/apply?token=${token}`;
}

export function buildEnrollmentLink(token: string | null | undefined): string | null {
  if (!token) return null;
  return `${window.location.origin}/enrollment/apply?token=${token}`;
}

export function isEnrollmentEligible(status: string | null | undefined): boolean {
  if (!status) return false;
  return ENROLLMENT_ELIGIBLE_STATUSES.includes(
    status as (typeof ENROLLMENT_ELIGIBLE_STATUSES)[number]
  );
}

export function getApplicationStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  switch (status) {
    case 'PENDING':
      return 'Aguardando Envio';
    case 'LINK_SENT':
      return 'Link Enviado';
    case 'FORM_RECEIVED':
      return 'Formulário Recebido';
    case 'NOT_REQUIRED':
      return 'Completo';
    default:
      return null;
  }
}

export function formatAddressLine(address: Lead['address']): string {
  if (!address) return '';
  const streetPart = [address.street, address.number].filter(Boolean).join(', ');
  const neighborhoodPart = address.neighborhood ? ` - ${address.neighborhood}` : '';
  const cityState = [address.city, address.state].filter(Boolean).join('/');
  const cityStatePart = cityState ? ` - ${cityState}` : '';
  const zipPart = address.zipCode ? ` (${address.zipCode})` : '';
  return `${streetPart}${neighborhoodPart}${cityStatePart}${zipPart}`;
}

export function hasFormData(lead: Lead): boolean {
  return !!(
    lead.parents?.length ||
    lead.address ||
    lead.additionalInfo ||
    lead.educationHistory?.length
  );
}
