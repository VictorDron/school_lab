import { describe, it, expect, vi } from 'vitest';
import * as XLSX from 'xlsx';
import {
  parseImportFile,
  decodeCSVBuffer,
  validateRows,
} from '../services/import.service.js';
import { parseHeader, parseCSVBoolean } from '../services/import-mapping.js';

// Mock prisma to prevent actual DB calls
vi.mock('../config/database.js', () => ({
  prisma: {},
}));

function createTestCSV(rows: string[][]): Buffer {
  const content = rows.map((r) => r.join(';')).join('\n');
  return Buffer.from(content, 'utf-8');
}

function createTestXLSX(rows: string[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// IMP-02: Parser de Excel/CSV com validacao por linha
describe('Import Parser', () => {
  describe('parseImportFile', () => {
    it('should parse CSV with semicolon delimiter', () => {
      const csv = createTestCSV([
        ['Course', 'Module', 'Class', 'Student'],
        ['Pre-school', 'RIS Pre-K3', 'Pre-K3 A', 'Joao Silva'],
        ['Pre-school', 'RIS Pre-K4', 'Pre-K4 B', 'Maria Santos'],
      ]);

      const result = parseImportFile(csv, 'test.csv');

      expect(result.headers).toEqual(['Course', 'Module', 'Class', 'Student']);
      expect(result.rows.length).toBe(2);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0][3]).toBe('Joao Silva');
      expect(result.rows[1][3]).toBe('Maria Santos');
    });

    it('should parse XLSX file', () => {
      const xlsx = createTestXLSX([
        ['Course', 'Module', 'Class', 'Student'],
        ['Pre-school', 'RIS Kinder', 'Kinder A', 'Pedro Costa'],
      ]);

      const result = parseImportFile(xlsx, 'test.xlsx');

      expect(result.headers).toEqual(['Course', 'Module', 'Class', 'Student']);
      expect(result.totalRows).toBe(1);
      expect(result.rows[0][3]).toBe('Pedro Costa');
    });

    it('should handle Latin-1 encoding correctly', () => {
      // Create Latin-1 buffer with accented characters
      const latin1Content = 'Name;Grade\nJoão;1st\nMaría;2nd';
      const latin1Buffer = Buffer.from(latin1Content, 'latin1');

      const decoded = decodeCSVBuffer(latin1Buffer);
      expect(decoded).toContain('João');
      expect(decoded).toContain('María');
    });

    it('should handle UTF-8 BOM', () => {
      const bom = Buffer.from([0xef, 0xbb, 0xbf]);
      const content = Buffer.from('Name;Grade\nTest;1st', 'utf-8');
      const withBom = Buffer.concat([bom, content]);

      const decoded = decodeCSVBuffer(withBom);
      expect(decoded).toContain('Name');
      expect(decoded).toContain('Test');
    });

    it('should return correct row count', () => {
      const csv = createTestCSV([
        ['H1', 'H2', 'H3', 'H4'],
        ['a', 'b', 'c', 'd'],
        ['e', 'f', 'g', 'h'],
        ['i', 'j', 'k', 'l'],
      ]);

      const result = parseImportFile(csv, 'test.csv');
      expect(result.totalRows).toBe(3);
    });
  });

  describe('parseHeader', () => {
    it('should split bilingual header at pipe', () => {
      const result = parseHeader('Weight| Peso:');
      expect(result.en).toBe('Weight');
      expect(result.pt).toBe('Peso');
    });

    it('should handle header without pipe', () => {
      const result = parseHeader('Student');
      expect(result.en).toBe('Student');
      expect(result.pt).toBe('Student');
    });
  });

  describe('parseCSVBoolean', () => {
    it('should parse "Yes| Sim" as true', () => {
      expect(parseCSVBoolean('Yes| Sim')).toBe(true);
    });

    it('should parse "No| Nao" as false', () => {
      expect(parseCSVBoolean('No| Nao')).toBe(false);
    });

    it('should parse empty string as false', () => {
      expect(parseCSVBoolean('')).toBe(false);
    });

    it('should parse dash as false', () => {
      expect(parseCSVBoolean('-')).toBe(false);
    });
  });

  describe('row validation', () => {
    it('should report error for row missing studentName', () => {
      const rows = [['Pre-school', 'RIS Pre-K3', 'Pre-K3 A', '']];
      const headers = ['Course', 'Module', 'Class', 'Student'];

      const { errors } = validateRows(rows, headers);

      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.field === 'studentName');
      expect(nameError).toBeDefined();
      expect(nameError!.severity).toBe('error');
    });

    it('should NOT block row with missing CPF per D-03', () => {
      // CPF is optional — missing CPF should NOT produce an error
      const rows = [['Pre-school', 'RIS Pre-K3', 'Pre-K3 A', 'Joao Silva']];
      const headers = ['Course', 'Module', 'Class', 'Student'];

      const { errors } = validateRows(rows, headers);

      const cpfError = errors.find((e) => e.field === 'cpf');
      expect(cpfError).toBeUndefined();
    });

    it('should parse row with valid data and return parsedRow', () => {
      const rows = [['Pre-school', 'RIS Pre-K3', 'Pre-K3 A', 'Joao Silva']];
      const headers = ['Course', 'Module', 'Class', 'Student'];

      const { parsedRows } = validateRows(rows, headers);

      expect(parsedRows.length).toBe(1);
      expect(parsedRows[0].studentName).toBe('Joao Silva');
      expect(parsedRows[0].grade).toBe('Pre-K3');
      expect(parsedRows[0].course).toBe('Pre-school');
    });

    it('should map module to grade via GRADE_MAP', () => {
      const rows = [['Elem', '1st Grade (1o Ano)', 'Class A', 'Ana Lima']];
      const headers = ['Course', 'Module', 'Class', 'Student'];

      const { parsedRows } = validateRows(rows, headers);

      expect(parsedRows[0].grade).toBe('1st Grade');
    });
  });
});
