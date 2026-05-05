/**
 * Shared validation utilities for public forms (Admission + Enrollment).
 */

/** Algorithmic CPF validation (check digits). Returns true when valid or when empty. */
export const validateCPF = (value: string | undefined): boolean | string => {
  if (!value) return true;
  const numbers = value.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  // Check digit verification
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(numbers[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(numbers[10])) return false;
  return true;
};

/** Algorithmic CNPJ validation (check digits). Returns true when valid or when empty. */
export const validateCNPJ = (value: string | undefined): boolean => {
  if (!value) return true;
  const numbers = value.replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  // First check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(numbers[i]) * weights1[i];
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(numbers[12]) !== digit1) return false;
  // Second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(numbers[i]) * weights2[i];
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(numbers[13]) !== digit2) return false;
  return true;
};

/** Email format validation. Returns true when valid or when empty. */
export const validateEmail = (value: string | undefined): boolean => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

/** Validates that a date string is not in the future. Returns true when valid or when empty. */
export const validateNotFutureDate = (value: string | undefined): boolean => {
  if (!value) return true;
  const date = new Date(value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

/** Returns today's date as an ISO string (YYYY-MM-DD) for use in `max` attributes. */
export const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** Scrolls to the first element with `data-field-error="true"` or `.text-red-500`. */
export const scrollToFirstError = () => {
  setTimeout(() => {
    const errorEl =
      document.querySelector('[data-field-error="true"]') ||
      document.querySelector('.text-red-500');
    if (errorEl) {
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
};

/** Converts an ISO date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY). */
export const formatDateToBR = (isoDate: string | undefined): string => {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

/** Maps a gender code (M/F) to a localized label. */
export const mapGender = (code: string | undefined, language: string): string => {
  if (!code) return '-';
  const map: Record<string, Record<string, string>> = {
    M: { pt: 'Masculino', en: 'Male' },
    F: { pt: 'Feminino', en: 'Female' },
  };
  return map[code]?.[language] || code;
};
