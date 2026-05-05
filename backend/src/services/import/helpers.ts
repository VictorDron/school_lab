/** Maximum rows processed per progress checkpoint during import. */
export const BATCH_SIZE = 10;

export function extractSurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Build a stable family-grouping key from name + phone. Whitespace is
 * trimmed/lowercased; phone is stripped to digits so "(21) 99999-1111"
 * and "21999991111" hash the same. Returns null when both fields are
 * empty — caller treats that as "ungroupable, fall back to surname".
 */
export function normalizeContactKey(name: string, phone: string): string | null {
  const n = (name || '').toLowerCase().trim();
  const p = (phone || '').replace(/\D/g, '');
  if (!n && !p) return null;
  return `${n}|${p}`;
}
