import { vi, describe, it, expect, beforeEach } from 'vitest';

// ── Mock setup ──────────────────────────────────────────────────────

const mockPrisma = vi.hoisted(() => ({
  reEnrollmentPeriod: {
    findUnique: vi.fn(),
  },
  periodPriceTable: {
    findMany: vi.fn(),
  },
  student: {
    findMany: vi.fn(),
  },
  familyPriceException: {
    findMany: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({ prisma: mockPrisma }));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getDashboardData } from '../services/re-enrollment-financial.service.js';

// ── Fixtures ────────────────────────────────────────────────────────

const PERIOD_ID = 'period-001';

const basePeriod = {
  id: PERIOD_ID,
  name: 'Rematrícula 2027',
  status: 'OPEN',
  adjustmentPercent: { toNumber: () => 10 },
  eligibleGrades: ['1st Grade', '2nd Grade'],
  targetYear: 2027,
};

const basePriceTable = [
  {
    id: 'pt-1',
    periodId: PERIOD_ID,
    grade: '1st Grade',
    baseAnnualValue: { toNumber: () => 50000 },
    enrollmentFee: { toNumber: () => 2000 },
    discountPercent: null,
  },
];

function makeStudent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'student-001',
    code: 'STU-001',
    fullName: 'João Silva',
    grade: '1st Grade',
    status: 'ACTIVE',
    academicYear: 2026,
    lead: {
      id: 'lead-001',
      familyName: 'Silva',
      contracts: [
        {
          id: 'contract-001',
          status: 'ACTIVE',
          totalAnnualValue: { toNumber: () => 48000 },
          payments: [
            { status: 'PAID' },
            { status: 'PENDING' },
          ],
        },
      ],
    },
    child: { id: 'child-001', fullName: 'João Silva' },
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(basePeriod);
    mockPrisma.periodPriceTable.findMany.mockResolvedValue(basePriceTable);
    mockPrisma.student.findMany.mockResolvedValue([makeStudent()]);
    mockPrisma.familyPriceException.findMany.mockResolvedValue([]);
  });

  it('returns all PRE-01 required columns for each student', async () => {
    const result = await getDashboardData(PERIOD_ID);

    expect(result.periodId).toBe(PERIOD_ID);
    expect(result.periodName).toBe('Rematrícula 2027');
    expect(result.periodStatus).toBe('OPEN');
    expect(result.adjustmentPercent).toBe(10);
    expect(result.priceTable).toHaveLength(1);

    const student = result.students[0];
    expect(student).toHaveProperty('studentId');
    expect(student).toHaveProperty('studentName');
    expect(student).toHaveProperty('studentCode');
    expect(student).toHaveProperty('grade');
    expect(student).toHaveProperty('academicStatus');
    expect(student).toHaveProperty('financialStatus');
    expect(student).toHaveProperty('currentAnnualValue');
    expect(student).toHaveProperty('baseAnnualValue');
    expect(student).toHaveProperty('adjustmentPercent');
    expect(student).toHaveProperty('proposedAnnualValue');
    expect(student).toHaveProperty('hasException');
    expect(student).toHaveProperty('exceptionJustification');
    expect(student).toHaveProperty('finalAnnualValue');
    expect(student).toHaveProperty('monthlyValue');
  });

  it('calculates financialStatus ADIMPLENTE for student with no overdue payments', async () => {
    const result = await getDashboardData(PERIOD_ID);
    expect(result.students[0].financialStatus).toBe('ADIMPLENTE');
  });

  it('calculates financialStatus INADIMPLENTE for student with overdue payments', async () => {
    const inadimplenteStudent = makeStudent({
      id: 'student-002',
      lead: {
        id: 'lead-002',
        familyName: 'Souza',
        contracts: [
          {
            id: 'contract-002',
            status: 'ACTIVE',
            totalAnnualValue: { toNumber: () => 48000 },
            payments: [
              { status: 'PAID' },
              { status: 'OVERDUE' },
            ],
          },
        ],
      },
    });
    mockPrisma.student.findMany.mockResolvedValue([inadimplenteStudent]);

    const result = await getDashboardData(PERIOD_ID);
    expect(result.students[0].financialStatus).toBe('INADIMPLENTE');
  });

  it('returns SEM_CONTRATO for student without contract', async () => {
    const noContractStudent = makeStudent({
      id: 'student-003',
      lead: {
        id: 'lead-003',
        familyName: 'Oliveira',
        contracts: [],
      },
    });
    mockPrisma.student.findMany.mockResolvedValue([noContractStudent]);

    const result = await getDashboardData(PERIOD_ID);
    expect(result.students[0].financialStatus).toBe('SEM_CONTRATO');
    expect(result.students[0].currentAnnualValue).toBeNull();
  });

  it('calculates proposed values with adjustment percent', async () => {
    // baseAnnualValue = 50000, adjustmentPercent = 10 -> proposedAnnualValue = 55000
    const result = await getDashboardData(PERIOD_ID);
    expect(result.students[0].proposedAnnualValue).toBe(55000);
    expect(result.students[0].finalAnnualValue).toBe(55000);
    expect(result.students[0].monthlyValue).toBe(4583.33);
  });

  it('applies exception override to final value', async () => {
    const exception = {
      id: 'exc-001',
      periodId: PERIOD_ID,
      studentId: 'student-001',
      overrideAnnualValue: { toNumber: () => 40000 },
      overrideDiscountPercent: null,
      justification: 'Desconto especial para funcionário.',
      createdById: 'user-001',
    };
    mockPrisma.familyPriceException.findMany.mockResolvedValue([exception]);

    const result = await getDashboardData(PERIOD_ID);
    const student = result.students[0];
    expect(student.hasException).toBe(true);
    expect(student.exceptionJustification).toBe('Desconto especial para funcionário.');
    expect(student.finalAnnualValue).toBe(40000);
    expect(student.monthlyValue).toBe(3333.33);
  });

  it('handles missing price table entry for grade', async () => {
    const studentNoPrice = makeStudent({
      id: 'student-004',
      grade: '5th Grade', // not in price table
    });
    mockPrisma.student.findMany.mockResolvedValue([studentNoPrice]);

    const result = await getDashboardData(PERIOD_ID);
    expect(result.students[0].baseAnnualValue).toBeNull();
    expect(result.students[0].proposedAnnualValue).toBeNull();
    expect(result.students[0].finalAnnualValue).toBeNull();
    expect(result.students[0].monthlyValue).toBeNull();
  });

  it('builds correct summary counts', async () => {
    const adimplente = makeStudent({ id: 'student-a', code: 'STU-A' });
    const inadimplente = makeStudent({
      id: 'student-b',
      code: 'STU-B',
      lead: {
        id: 'lead-b',
        familyName: 'Barros',
        contracts: [
          {
            id: 'contract-b',
            status: 'ACTIVE',
            totalAnnualValue: { toNumber: () => 48000 },
            payments: [{ status: 'OVERDUE' }],
          },
        ],
      },
    });
    const semContrato = makeStudent({
      id: 'student-c',
      code: 'STU-C',
      lead: { id: 'lead-c', familyName: 'Campos', contracts: [] },
    });
    mockPrisma.student.findMany.mockResolvedValue([adimplente, inadimplente, semContrato]);

    const exception = {
      id: 'exc-a',
      periodId: PERIOD_ID,
      studentId: 'student-a',
      overrideAnnualValue: { toNumber: () => 45000 },
      overrideDiscountPercent: null,
      justification: 'Motivo.',
      createdById: 'user-001',
    };
    mockPrisma.familyPriceException.findMany.mockResolvedValue([exception]);

    const result = await getDashboardData(PERIOD_ID);
    expect(result.summary.total).toBe(3);
    expect(result.summary.adimplente).toBe(1);
    expect(result.summary.inadimplente).toBe(1);
    expect(result.summary.semContrato).toBe(1);
    expect(result.summary.withException).toBe(1);
  });

  it('throws PERIOD_NOT_FOUND for missing period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(null);
    await expect(getDashboardData('bad-id')).rejects.toThrow();
  });
});
