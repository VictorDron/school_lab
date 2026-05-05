const FORMULA_CHARS = ['=', '+', '-', '@'];

function sanitizeValue(value: string): string {
  if (value.length > 0 && FORMULA_CHARS.includes(value[0])) {
    return '\t' + value;
  }
  return value;
}

function escapeCSVField(value: string): string {
  const sanitized = sanitizeValue(value);
  const escaped = sanitized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateCSV(rows: Record<string, string>[], headers: string[]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSVField(row[h] ?? '')).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}
