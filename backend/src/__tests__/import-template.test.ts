import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { generateTemplate } from '../services/import.service.js';
import { COLUMN_MAP } from '../services/import-mapping.js';

// Mock prisma
vi.mock('../config/database.js', () => ({
  prisma: {},
}));

// IMP-01: Template de importacao para download
describe('Import Template', () => {
  it('should generate a non-empty XLSX buffer', () => {
    const buffer = generateTemplate();

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should have correct number of columns (96)', () => {
    const buffer = generateTemplate();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

    const headers = data[0];
    expect(headers.length).toBe(96);
  });

  it('should have headers matching COLUMN_MAP', () => {
    const buffer = generateTemplate();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

    const headers = data[0];

    for (let i = 0; i < COLUMN_MAP.length; i++) {
      const expected = `${COLUMN_MAP[i].csvHeaderEN}| ${COLUMN_MAP[i].csvHeaderPT}`;
      expect(headers[i]).toBe(expected);
    }
  });

  it('should include example row with values from COLUMN_MAP', () => {
    const buffer = generateTemplate();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });

    expect(data.length).toBeGreaterThanOrEqual(2);

    const exampleRow = data[1];
    // Column 3 (Student) example should be 'Joao Silva'
    const studentCol = COLUMN_MAP.find((c) => c.csvIndex === 3);
    expect(exampleRow[3]).toBe(studentCol?.example ?? '');

    // Column 0 (Course) example
    const courseCol = COLUMN_MAP.find((c) => c.csvIndex === 0);
    expect(exampleRow[0]).toBe(courseCol?.example ?? '');
  });
});
