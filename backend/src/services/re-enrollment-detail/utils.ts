export function toNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}
