/**
 * Splits bilingual header "English| Portugues:" into parts.
 * Removes trailing colon and whitespace.
 */
export function parseHeader(header: string): { en: string; pt: string } {
  const cleaned = header.replace(/:\s*$/, '').trim();
  const pipeIndex = cleaned.indexOf('|');

  if (pipeIndex === -1) {
    return { en: cleaned, pt: cleaned };
  }

  return {
    en: cleaned.substring(0, pipeIndex).trim(),
    pt: cleaned.substring(pipeIndex + 1).trim(),
  };
}

/**
 * Converts bilingual boolean CSV values to boolean.
 * "Yes| Sim" -> true, "No| Não" -> false, "-" -> false, "" -> false
 */
export function parseCSVBoolean(value: string): boolean {
  if (!value || value === '-') return false;
  const normalized = value.toLowerCase().trim();
  return normalized.includes('yes') || normalized.includes('sim');
}

/**
 * Splits comma-separated values into array, trimming each element.
 * Handles bilingual entries like "Mold| Mofo, Dust| Poeira".
 */
export function parseCSVList(value: string): string[] {
  if (!value || value === '-') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
