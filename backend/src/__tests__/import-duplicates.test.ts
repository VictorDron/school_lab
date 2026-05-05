import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParsedRow } from '../types/import.types.js';

// Mock prisma before importing service
const mockFindMany = vi.fn();
vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

import { detectDuplicates } from '../services/import.service.js';

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

// IMP-04: Deteccao e tratamento de duplicatas
describe('Duplicate Detection', () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it('should detect duplicate by exact CPF match', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'stu-1',
        fullName: 'Joao Silva',
        cpf: '12345678901',
        grade: 'Pre-K3',
      },
    ]);

    const rows = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Joao Silva Diferente',
        grade: 'Kinder',
        raw: { col_69: '123.456.789-01' },
      }),
    ];

    const duplicates = await detectDuplicates(rows);

    expect(duplicates.length).toBe(1);
    expect(duplicates[0].matchType).toBe('CPF');
    expect(duplicates[0].existingStudentId).toBe('stu-1');
    expect(duplicates[0].action).toBe('skip');
  });

  it('should detect duplicate by fullName + grade match (case insensitive)', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'stu-2',
        fullName: 'Maria Santos',
        cpf: null,
        grade: 'Kinder',
      },
    ]);

    const rows = [
      createParsedRow({
        rowNumber: 3,
        studentName: 'maria santos',
        grade: 'Kinder',
        raw: {},
      }),
    ];

    const duplicates = await detectDuplicates(rows);

    expect(duplicates.length).toBe(1);
    expect(duplicates[0].matchType).toBe('NAME_GRADE');
    expect(duplicates[0].existingStudentId).toBe('stu-2');
  });

  it('should return no duplicates for unique students', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'stu-3',
        fullName: 'Pedro Costa',
        cpf: null,
        grade: '1st Grade',
      },
    ]);

    const rows = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Ana Lima',
        grade: '2nd Grade',
        raw: {},
      }),
    ];

    const duplicates = await detectDuplicates(rows);

    expect(duplicates.length).toBe(0);
  });

  it('should handle null CPF gracefully', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'stu-4',
        fullName: 'Lucas Oliveira',
        cpf: null,
        grade: '3rd Grade',
      },
    ]);

    const rows = [
      createParsedRow({
        rowNumber: 2,
        studentName: 'Lucas Oliveira',
        grade: '4th Grade',
        raw: { col_69: '' },
      }),
    ];

    // Different grade + no CPF = no duplicate
    const duplicates = await detectDuplicates(rows);
    expect(duplicates.length).toBe(0);
  });
});
