import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { previewImport, detectFamilies, validateRows } from '../services/import.service.js';
import type { ParsedRow } from '../types/import.types.js';

// Mock prisma for duplicate detection
const mockFindMany = vi.fn();
vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

function createTestCSV(rows: string[][]): Buffer {
  const content = rows.map((r) => r.join(';')).join('\n');
  return Buffer.from(content, 'utf-8');
}

function createParsedRow(overrides: Partial<ParsedRow> = {}): ParsedRow {
  return {
    rowNumber: 2,
    studentName: 'Test Student',
    course: 'Pre-school',
    module: 'RIS Pre-K3',
    classGroup: 'Pre-K3 A',
    grade: 'Pre-K3',
    raw: {},
    health: {},
    transport: {},
    emergencyContacts: [],
    healthPlan: {},
    enrollmentInfo: {},
    ...overrides,
  };
}

// IMP-03: Preview (dry-run) antes de confirmar importacao
describe('Import Preview', () => {
  beforeEach(() => {
    mockFindMany.mockReset();
    mockFindMany.mockResolvedValue([]);
  });

  it('should return parsed rows without DB writes', async () => {
    // 96 columns: fill minimum required, rest empty
    const header = new Array(96).fill('');
    header[0] = 'Course';
    header[1] = 'Module';
    header[2] = 'Class';
    header[3] = 'Student';

    const row1 = new Array(96).fill('');
    row1[0] = 'Pre-school';
    row1[1] = 'RIS Pre-K3';
    row1[2] = 'Pre-K3 A';
    row1[3] = 'Joao Silva';

    const csv = createTestCSV([header, row1]);

    const result = await previewImport(csv, 'test.csv');

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].studentName).toBe('Joao Silva');
    expect(result.rows[0].grade).toBe('Pre-K3');
  });

  it('should return errors for invalid rows', async () => {
    const header = new Array(96).fill('');
    header[0] = 'Course';
    header[1] = 'Module';
    header[2] = 'Class';
    header[3] = 'Student';

    const row1 = new Array(96).fill('');
    row1[0] = 'Pre-school';
    // Missing studentName (col 3 is empty)

    const csv = createTestCSV([header, row1]);

    const result = await previewImport(csv, 'test.csv');

    expect(result.errors.length).toBeGreaterThan(0);
    const nameError = result.errors.find((e) => e.field === 'studentName');
    expect(nameError).toBeDefined();
  });

  it('should return summary with correct counts', async () => {
    const header = new Array(96).fill('');
    header[3] = 'Student';

    const row1 = new Array(96).fill('');
    row1[3] = 'Joao Silva';

    const row2 = new Array(96).fill('');
    // Missing student name — should be error row

    const row3 = new Array(96).fill('');
    row3[3] = 'Maria Santos';

    const csv = createTestCSV([header, row1, row2, row3]);

    const result = await previewImport(csv, 'test.csv');

    expect(result.summary.totalRows).toBe(3);
    // 1 row missing studentName = 1 error row
    expect(result.summary.errorRows).toBe(1);
    expect(result.summary.validRows).toBe(2);
  });
});

describe('Family Detection', () => {
  it('should detect family groups by shared emergency contact', () => {
    const rows: ParsedRow[] = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Ana Silva',
        emergencyContacts: [
          { name: 'Maria Silva', phone: '21999999999', email: '', isPrimary: true },
        ],
      }),
      createParsedRow({
        rowNumber: 3,
        studentName: 'Pedro Silva',
        emergencyContacts: [
          { name: 'Maria Silva', phone: '21999999999', email: '', isPrimary: true },
        ],
      }),
    ];

    const families = detectFamilies(rows);

    const contactFamilies = families.filter(
      (f) => f.detectionMethod === 'EMERGENCY_CONTACT',
    );
    expect(contactFamilies.length).toBe(1);
    expect(contactFamilies[0].members.length).toBe(2);
  });

  it('should detect family groups by shared surname (D-07)', () => {
    const rows: ParsedRow[] = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Ana Costa',
        emergencyContacts: [],
      }),
      createParsedRow({
        rowNumber: 3,
        studentName: 'Pedro Costa',
        emergencyContacts: [],
      }),
    ];

    const families = detectFamilies(rows);

    const surnameFamilies = families.filter(
      (f) => f.detectionMethod === 'SURNAME',
    );
    expect(surnameFamilies.length).toBe(1);
    expect(surnameFamilies[0].members.length).toBe(2);
    expect(surnameFamilies[0].familyName).toBe('Costa');
  });

  it('should create single-student families for unmatched rows', () => {
    const rows: ParsedRow[] = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Ana UniqueLastName',
        emergencyContacts: [],
      }),
    ];

    const families = detectFamilies(rows);

    expect(families.length).toBe(1);
    expect(families[0].detectionMethod).toBe('SINGLE');
    expect(families[0].members.length).toBe(1);
  });
});
