import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  canTransitionPeriod as canTransition,
  createPeriod,
  transitionPeriod,
  findPeriodById as findById,
  findManyPeriods as findMany,
} from '../services/re-enrollment-period.service.js';

type ReEnrollmentPeriodStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINALIZED';

const mockPrisma = vi.hoisted(() => ({
  reEnrollmentPeriod: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  runWithTenant: <T>(_id: string, fn: () => T) => fn(),
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../utils/helpers.js', () => ({
  getPaginationParams: vi.fn((query: any) => ({
    page: query.page || 1,
    limit: query.limit || 25,
    skip: ((query.page || 1) - 1) * (query.limit || 25),
  })),
}));

describe('Period State Machine - canTransition', () => {
  // Valid transitions (linear: DRAFT -> OPEN -> CLOSED -> FINALIZED)
  const validPairs: [ReEnrollmentPeriodStatus, ReEnrollmentPeriodStatus][] = [
    ['DRAFT', 'OPEN'],
    ['OPEN', 'CLOSED'],
    ['CLOSED', 'FINALIZED'],
  ];

  validPairs.forEach(([from, to]) => {
    it(`should allow ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  // Invalid transitions
  const invalidPairs: [ReEnrollmentPeriodStatus, ReEnrollmentPeriodStatus][] = [
    ['DRAFT', 'CLOSED'],
    ['DRAFT', 'FINALIZED'],
    ['OPEN', 'DRAFT'],
    ['OPEN', 'FINALIZED'],
    ['CLOSED', 'OPEN'],
    ['CLOSED', 'DRAFT'],
  ];

  invalidPairs.forEach(([from, to]) => {
    it(`should reject ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  it('should not allow any transition from FINALIZED', () => {
    const allStatuses: ReEnrollmentPeriodStatus[] = ['DRAFT', 'OPEN', 'CLOSED', 'FINALIZED'];
    allStatuses.forEach((to) => {
      expect(canTransition('FINALIZED', to)).toBe(false);
    });
  });
});

describe('Period CRUD - createPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a period in DRAFT status with all fields', async () => {
    const input = {
      name: 'Rematricula 2027',
      targetYear: 2027,
      startDate: new Date('2027-01-15'),
      endDate: new Date('2027-02-15'),
      eligibleGrades: ['1st Grade', '2nd Grade', '3rd Grade'],
    };
    const userId = 'user-123';

    const expectedPeriod = {
      id: 'period-1',
      ...input,
      status: 'DRAFT',
      createdById: userId,
      openedAt: null,
      closedAt: null,
      finalizedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.reEnrollmentPeriod.create.mockResolvedValue(expectedPeriod);

    const result = await createPeriod(input, userId);

    expect(mockPrisma.reEnrollmentPeriod.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Rematricula 2027',
        targetYear: 2027,
        startDate: input.startDate,
        endDate: input.endDate,
        eligibleGrades: ['1st Grade', '2nd Grade', '3rd Grade'],
        createdById: userId,
        status: 'DRAFT',
      }),
    });
    expect(result).toEqual(expectedPeriod);
    expect(result.status).toBe('DRAFT');
  });
});

describe('Period CRUD - transitionPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should transition DRAFT to OPEN and set openedAt when no other period is OPEN', async () => {
    const period = {
      id: 'period-1',
      status: 'DRAFT',
      name: 'Rematricula 2027',
    };
    const updatedPeriod = { ...period, status: 'OPEN', openedAt: expect.any(Date) };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue(null); // no other OPEN period
    mockPrisma.reEnrollmentPeriod.update.mockResolvedValue(updatedPeriod);

    const result = await transitionPeriod('period-1', 'OPEN', 'user-123');

    expect(mockPrisma.reEnrollmentPeriod.findFirst).toHaveBeenCalledWith({
      where: { status: 'OPEN', id: { not: 'period-1' } },
      select: { id: true, name: true },
    });
    expect(mockPrisma.reEnrollmentPeriod.update).toHaveBeenCalledWith({
      where: { id: 'period-1' },
      data: {
        status: 'OPEN',
        openedAt: expect.any(Date),
      },
    });
    expect(result.status).toBe('OPEN');
  });

  it('should throw PERIOD_ALREADY_OPEN when another period is OPEN', async () => {
    const period = { id: 'period-1', status: 'DRAFT' };
    const otherOpenPeriod = { id: 'period-2', status: 'OPEN' };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue(otherOpenPeriod);

    await expect(transitionPeriod('period-1', 'OPEN', 'user-123')).rejects.toThrow(
      'Já existe uma campanha de rematrícula aberta',
    );
  });

  it('should transition OPEN to CLOSED and set closedAt', async () => {
    const period = { id: 'period-1', status: 'OPEN' };
    const updatedPeriod = { ...period, status: 'CLOSED', closedAt: new Date() };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);
    mockPrisma.reEnrollmentPeriod.update.mockResolvedValue(updatedPeriod);

    const result = await transitionPeriod('period-1', 'CLOSED', 'user-123');

    expect(mockPrisma.reEnrollmentPeriod.update).toHaveBeenCalledWith({
      where: { id: 'period-1' },
      data: {
        status: 'CLOSED',
        closedAt: expect.any(Date),
      },
    });
    expect(result.status).toBe('CLOSED');
  });

  it('should transition CLOSED to FINALIZED and set finalizedAt', async () => {
    const period = { id: 'period-1', status: 'CLOSED' };
    const updatedPeriod = { ...period, status: 'FINALIZED', finalizedAt: new Date() };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);
    mockPrisma.reEnrollmentPeriod.update.mockResolvedValue(updatedPeriod);

    const result = await transitionPeriod('period-1', 'FINALIZED', 'user-123');

    expect(mockPrisma.reEnrollmentPeriod.update).toHaveBeenCalledWith({
      where: { id: 'period-1' },
      data: {
        status: 'FINALIZED',
        finalizedAt: expect.any(Date),
      },
    });
    expect(result.status).toBe('FINALIZED');
  });

  it('should throw INVALID_PERIOD_TRANSITION for invalid transitions', async () => {
    const period = { id: 'period-1', status: 'DRAFT' };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);

    await expect(transitionPeriod('period-1', 'CLOSED', 'user-123')).rejects.toThrow(
      'Transição de status inválida para esta campanha.',
    );
  });

  it('should throw PERIOD_NOT_FOUND when period does not exist', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(null);

    await expect(transitionPeriod('nonexistent', 'OPEN', 'user-123')).rejects.toThrow(
      'Campanha de rematrícula não encontrada.',
    );
  });
});

describe('Period CRUD - findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return period when found', async () => {
    const period = {
      id: 'period-1',
      name: 'Rematricula 2027',
      status: 'DRAFT',
      _count: { invites: 5 },
    };

    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(period);

    const result = await findById('period-1');

    expect(mockPrisma.reEnrollmentPeriod.findUnique).toHaveBeenCalledWith({
      where: { id: 'period-1' },
      include: { _count: { select: { invites: true } } },
    });
    expect(result).toEqual(period);
  });

  it('should throw PERIOD_NOT_FOUND when not found', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(null);

    await expect(findById('nonexistent')).rejects.toThrow(
      'Campanha de rematrícula não encontrada.',
    );
  });
});

describe('Period CRUD - findMany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated results with correct meta', async () => {
    const periods = [
      { id: 'period-1', name: 'Rematricula 2027', status: 'DRAFT' },
      { id: 'period-2', name: 'Rematricula 2026', status: 'FINALIZED' },
    ];

    mockPrisma.reEnrollmentPeriod.findMany.mockResolvedValue(periods);
    mockPrisma.reEnrollmentPeriod.count.mockResolvedValue(2);

    const result = await findMany({}, { page: 1, limit: 25 });

    expect(result.periods).toEqual(periods);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.totalPages).toBe(1);
  });

  it('should filter by status when provided', async () => {
    mockPrisma.reEnrollmentPeriod.findMany.mockResolvedValue([]);
    mockPrisma.reEnrollmentPeriod.count.mockResolvedValue(0);

    await findMany({ status: 'OPEN' }, { page: 1, limit: 25 });

    expect(mockPrisma.reEnrollmentPeriod.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN' }),
      }),
    );
  });

  it('should filter by targetYear when provided', async () => {
    mockPrisma.reEnrollmentPeriod.findMany.mockResolvedValue([]);
    mockPrisma.reEnrollmentPeriod.count.mockResolvedValue(0);

    await findMany({ targetYear: 2027 }, { page: 1, limit: 25 });

    expect(mockPrisma.reEnrollmentPeriod.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ targetYear: 2027 }),
      }),
    );
  });
});
