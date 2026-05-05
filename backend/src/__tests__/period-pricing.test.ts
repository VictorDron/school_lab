import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  calculateProposedValue,
  getFinancialStatus,
  upsertPriceTable,
  getPriceTable,
  createException,
  updateException,
  deleteException,
  updateAdjustmentPercent,
} from '../services/period-pricing.service.js';

const mockPrisma = vi.hoisted(() => ({
  periodPriceTable: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  familyPriceException: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  reEnrollmentPeriod: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn().mockResolvedValue([]),
  },
  $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

// Phase 2e: services now read tenant context via ALS. Tests don't run
// inside an authenticated request, so stub requireTenantId.
vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  runWithTenant: <T>(_id: string, fn: () => T) => fn(),
  // Phase 6: bypass the GUC plumbing in tests — just delegate to the
  // mocked $transaction.
  withTenantTx: <T>(p: any, fn: (tx: any) => Promise<T>) =>
    p.$transaction(fn),
}));

// ── Pure calculation tests ──────────────────────────────────────────

describe('calculateProposedValue', () => {
  it('should apply positive adjustment (+10%)', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: 10,
    });
    expect(result.proposedValue).toBe(55000);
    expect(result.finalValue).toBe(55000);
    expect(result.monthlyValue).toBe(4583.33);
  });

  it('should apply negative adjustment (-5%)', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: -5,
    });
    expect(result.proposedValue).toBe(47500);
    expect(result.finalValue).toBe(47500);
    expect(result.monthlyValue).toBe(3958.33);
  });

  it('should handle zero adjustment', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: 0,
    });
    expect(result.proposedValue).toBe(50000);
    expect(result.finalValue).toBe(50000);
    expect(result.monthlyValue).toBe(4166.67);
  });

  it('should apply overrideAnnualValue when exception has fixed value', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: 10,
      exception: { overrideAnnualValue: 40000 },
    });
    expect(result.proposedValue).toBe(55000);
    expect(result.finalValue).toBe(40000);
    expect(result.monthlyValue).toBe(3333.33);
  });

  it('should apply overrideDiscountPercent when exception has discount', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: 10,
      exception: { overrideDiscountPercent: 20 },
    });
    expect(result.proposedValue).toBe(55000);
    expect(result.finalValue).toBe(44000);
    expect(result.monthlyValue).toBe(3666.67);
  });

  it('should prefer overrideAnnualValue over overrideDiscountPercent when both present', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 50000,
      adjustmentPercent: 10,
      exception: { overrideAnnualValue: 40000, overrideDiscountPercent: 20 },
    });
    expect(result.proposedValue).toBe(55000);
    expect(result.finalValue).toBe(40000);
    expect(result.monthlyValue).toBe(3333.33);
  });

  it('should handle large values correctly', () => {
    const result = calculateProposedValue({
      baseAnnualValue: 120000,
      adjustmentPercent: 7.5,
    });
    expect(result.proposedValue).toBe(129000);
    expect(result.finalValue).toBe(129000);
    expect(result.monthlyValue).toBe(10750);
  });
});

// ── Financial status tests ──────────────────────────────────────────

describe('getFinancialStatus', () => {
  it('should return SEM_CONTRATO for empty array', () => {
    expect(getFinancialStatus([])).toBe('SEM_CONTRATO');
  });

  it('should return SEM_CONTRATO for undefined/null', () => {
    expect(getFinancialStatus(undefined as unknown as Array<{ status: string }>)).toBe('SEM_CONTRATO');
    expect(getFinancialStatus(null as unknown as Array<{ status: string }>)).toBe('SEM_CONTRATO');
  });

  it('should return ADIMPLENTE when all payments are PAID or PENDING', () => {
    expect(getFinancialStatus([{ status: 'PAID' }, { status: 'PENDING' }])).toBe('ADIMPLENTE');
  });

  it('should return ADIMPLENTE when all payments are PAID', () => {
    expect(getFinancialStatus([{ status: 'PAID' }, { status: 'PAID' }])).toBe('ADIMPLENTE');
  });

  it('should return INADIMPLENTE when any payment is OVERDUE', () => {
    expect(getFinancialStatus([{ status: 'OVERDUE' }, { status: 'PAID' }])).toBe('INADIMPLENTE');
  });

  it('should return INADIMPLENTE when all payments are OVERDUE', () => {
    expect(getFinancialStatus([{ status: 'OVERDUE' }, { status: 'OVERDUE' }])).toBe('INADIMPLENTE');
  });
});

// ── CRUD operations with period guard ───────────────────────────────

describe('upsertPriceTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert price table for DRAFT period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    mockPrisma.periodPriceTable.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.periodPriceTable.createMany.mockResolvedValue({ count: 2 });

    await upsertPriceTable('p1', [
      { grade: '1st', baseAnnualValue: 50000, enrollmentFee: 2000, discountPercent: null },
      { grade: '2nd', baseAnnualValue: 55000, enrollmentFee: 2000, discountPercent: 5 },
    ]);

    expect(mockPrisma.periodPriceTable.deleteMany).toHaveBeenCalledWith({ where: { periodId: 'p1' } });
    expect(mockPrisma.periodPriceTable.createMany).toHaveBeenCalled();
  });

  it('should upsert price table for OPEN period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'OPEN' });
    mockPrisma.periodPriceTable.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.periodPriceTable.createMany.mockResolvedValue({ count: 1 });

    await upsertPriceTable('p1', [{ grade: '1st', baseAnnualValue: 50000, enrollmentFee: 0, discountPercent: null }]);

    expect(mockPrisma.periodPriceTable.deleteMany).toHaveBeenCalled();
  });

  it('should reject upsert for CLOSED period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'CLOSED' });

    await expect(
      upsertPriceTable('p1', [{ grade: '1st', baseAnnualValue: 50000, enrollmentFee: 0, discountPercent: null }])
    ).rejects.toThrow();
  });

  it('should reject upsert for FINALIZED period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'FINALIZED' });

    await expect(
      upsertPriceTable('p1', [{ grade: '1st', baseAnnualValue: 50000, enrollmentFee: 0, discountPercent: null }])
    ).rejects.toThrow();
  });
});

describe('createException', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create exception for DRAFT period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    mockPrisma.familyPriceException.create.mockResolvedValue({ id: 'e1', student: { fullName: 'Test' }, period: { name: 'Test' } });

    const result = await createException('p1', 's1', { overrideAnnualValue: 40000, justification: 'Bolsa parcial' }, 'u1');

    expect(result.id).toBe('e1');
    expect(mockPrisma.familyPriceException.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          periodId: 'p1',
          studentId: 's1',
          overrideAnnualValue: 40000,
          justification: 'Bolsa parcial',
          createdById: 'u1',
        }),
      }),
    );
  });

  it('should allow exception for CLOSED period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'CLOSED' });
    mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
    mockPrisma.familyPriceException.create.mockResolvedValue({ id: 'e1', student: { fullName: 'Test' }, period: { name: 'Test' } });

    const result = await createException('p1', 's1', { overrideAnnualValue: 40000, justification: 'Bolsa' }, 'u1');
    expect(result.id).toBe('e1');
  });

  it('should reject exception for FINALIZED period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'FINALIZED' });

    await expect(
      createException('p1', 's1', { overrideAnnualValue: 40000, justification: 'Bolsa' }, 'u1')
    ).rejects.toThrow();
  });
});

describe('updateAdjustmentPercent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update adjustment for DRAFT period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'DRAFT' });
    mockPrisma.reEnrollmentPeriod.update.mockResolvedValue({ id: 'p1', adjustmentPercent: 10 });

    const result = await updateAdjustmentPercent('p1', 10);

    expect(result.adjustmentPercent).toBe(10);
    expect(mockPrisma.reEnrollmentPeriod.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { adjustmentPercent: 10 },
    });
  });

  it('should reject update for FINALIZED period', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'p1', status: 'FINALIZED' });

    await expect(updateAdjustmentPercent('p1', 10)).rejects.toThrow();
  });
});
