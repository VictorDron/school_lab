/**
 * Coerce a Prisma Decimal / unknown numeric to a plain number, or null.
 * Decimals expose `toNumber()`; everything else gets a `Number(...)`
 * round-trip that nulls on NaN.
 */
export function toNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || null;
}
