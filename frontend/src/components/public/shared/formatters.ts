/**
 * Shared formatting utilities for public forms (Admission + Enrollment).
 * Display-only masks — no validation logic.
 */

export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

export const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export const formatPlate = (value: string): string => {
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Format: ABC1D23 or ABC-1234
  if (upper.length <= 7) {
    return upper.replace(/([A-Z]{3})(\d)/, '$1-$2');
  }
  return upper.slice(0, 7);
};

export const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
};

/** Alias for formatCEP — Admission uses the name formatZipCode. */
export const formatZipCode = formatCEP;
