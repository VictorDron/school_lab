import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  preReEnrollmentResponse: {
    findMany: vi.fn(),
  },
  reEnrollmentPeriod: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

import { getPreReEnrollmentReport } from '../services/re-enrollment-analytics.service.js';

// ── Helpers ────────────────────────────────────────────────────────

function mockDecimal(val: number) {
  return { toNumber: () => val };
}

function makeResponse(overrides: Record<string, unknown>) {
  return {
    id: 'resp-' + Math.random().toString(36).substring(7),
    status: 'PENDING',
    communicatedAnnualValue: null,
    communicatedAdjustmentPercent: null,
    negotiatedFinalValue: null,
    student: { grade: '5º Ano' },
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('getPreReEnrollmentReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      name: 'Rematrícula 2027',
    });
  });

  it('should return correct counts for all statuses', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'DISAGREED' }),
      makeResponse({ status: 'PENDING' }),
      makeResponse({ status: 'NEGOTIATING' }),
      makeResponse({ status: 'NEGOTIATED', communicatedAnnualValue: mockDecimal(55000), communicatedAdjustmentPercent: mockDecimal(10), negotiatedFinalValue: mockDecimal(52000) }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.total).toBe(6);
    expect(report.agreed).toBe(2);
    expect(report.disagreed).toBe(1);
    expect(report.noResponse).toBe(1);
    expect(report.negotiating).toBe(1);
    expect(report.negotiated).toBe(1);
  });

  it('should compute adhesionRate = ((agreed + negotiated) / total) * 100', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'NEGOTIATED', communicatedAnnualValue: mockDecimal(55000), communicatedAdjustmentPercent: mockDecimal(10), negotiatedFinalValue: mockDecimal(52000) }),
      makeResponse({ status: 'DISAGREED' }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    // (2 agreed + 1 negotiated) / 4 total = 75%
    expect(report.adhesionRate).toBeCloseTo(75, 1);
  });

  it('should return adhesionRate 0 when total is 0', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.adhesionRate).toBe(0);
    expect(report.total).toBe(0);
  });

  it('should group responses by student grade in byGrade breakdown', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({ status: 'AGREED', student: { grade: '3º Ano' }, communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'DISAGREED', student: { grade: '3º Ano' } }),
      makeResponse({ status: 'AGREED', student: { grade: '5º Ano' }, communicatedAdjustmentPercent: mockDecimal(10), communicatedAnnualValue: mockDecimal(55000) }),
      makeResponse({ status: 'PENDING', student: { grade: '5º Ano' } }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.byGrade).toHaveLength(2);

    const grade3 = report.byGrade.find((g) => g.grade === '3º Ano');
    expect(grade3).toBeDefined();
    expect(grade3!.total).toBe(2);
    expect(grade3!.agreed).toBe(1);
    expect(grade3!.disagreed).toBe(1);

    const grade5 = report.byGrade.find((g) => g.grade === '5º Ano');
    expect(grade5).toBeDefined();
    expect(grade5!.total).toBe(2);
    expect(grade5!.agreed).toBe(1);
    expect(grade5!.noResponse).toBe(1);
  });

  it('should compute averageEffectiveAdjustment using communicated and negotiated values', async () => {
    // AGREED: uses communicatedAdjustmentPercent directly (10%)
    // NEGOTIATED: base = 55000 / 1.10 = 50000, effective = ((52000 - 50000) / 50000) * 100 = 4%
    // Average = (10 + 4) / 2 = 7
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({
        status: 'AGREED',
        communicatedAdjustmentPercent: mockDecimal(10),
        communicatedAnnualValue: mockDecimal(55000),
      }),
      makeResponse({
        status: 'NEGOTIATED',
        communicatedAnnualValue: mockDecimal(55000),
        communicatedAdjustmentPercent: mockDecimal(10),
        negotiatedFinalValue: mockDecimal(52000),
      }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.averageEffectiveAdjustment).toBeCloseTo(7, 1);
  });

  it('should handle all-agreed scenario correctly', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(8), communicatedAnnualValue: mockDecimal(54000) }),
      makeResponse({ status: 'AGREED', communicatedAdjustmentPercent: mockDecimal(8), communicatedAnnualValue: mockDecimal(54000) }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.adhesionRate).toBe(100);
    expect(report.averageEffectiveAdjustment).toBe(8);
    expect(report.agreed).toBe(2);
    expect(report.disagreed).toBe(0);
  });

  it('should handle all-disagreed scenario (adhesion 0, no effective adjustment)', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([
      makeResponse({ status: 'DISAGREED' }),
      makeResponse({ status: 'DISAGREED' }),
    ]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.adhesionRate).toBe(0);
    expect(report.averageEffectiveAdjustment).toBe(0);
  });

  it('should include periodId and periodName in report', async () => {
    mockPrisma.preReEnrollmentResponse.findMany.mockResolvedValue([]);

    const report = await getPreReEnrollmentReport('period-1');

    expect(report.periodId).toBe('period-1');
    expect(report.periodName).toBe('Rematrícula 2027');
  });
});
