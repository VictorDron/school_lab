/**
 * Coerce a Prisma Decimal / unknown numeric to a plain number, or null.
 * Decimals expose a `toNumber()` method; everything else gets a `Number(...)`
 * round-trip with a `null` fallback for NaN.
 */
export function toNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || null;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
