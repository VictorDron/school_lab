/**
 * Normalize a CPF string by removing non-digit characters.
 * Returns null if the input is empty/undefined or doesn't have exactly 11 digits after cleanup.
 */
export function normalizeCPF(cpf: string | undefined | null): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11 ? digits : null;
}
