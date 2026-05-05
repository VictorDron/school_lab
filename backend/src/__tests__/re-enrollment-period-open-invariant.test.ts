/**
 * Single-OPEN-period invariant — guards against the bug where two
 * ReEnrollmentPeriod rows could end up with status='OPEN' simultaneously
 * (seed scripts and ad-hoc admin scripts bypassed the only validation point).
 *
 * Tests two layers:
 *   1. assertNoOtherOpenPeriod — the centralized helper itself.
 *   2. Controller path PATCH /periods/:id/transition — supertest-driven
 *      integration that proves the API surface returns 409 PERIOD_ALREADY_OPEN.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Router } from 'express';

const mockPrisma = vi.hoisted(() => ({
  reEnrollmentPeriod: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({ prisma: mockPrisma }));
vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  assertNoOtherOpenPeriod,
  transitionPeriod,
} from '../services/re-enrollment-period.service.js';
import * as ReEnrollmentController from '../controllers/re-enrollment.controller.js';
import { errorHandler } from '../middlewares/errorHandler.js';

describe('assertNoOtherOpenPeriod — single-OPEN invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve when no other period is OPEN', async () => {
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue(null);

    await expect(assertNoOtherOpenPeriod()).resolves.toBeUndefined();

    expect(mockPrisma.reEnrollmentPeriod.findFirst).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
      select: { id: true, name: true },
    });
  });

  it('should resolve when only the excluded period is OPEN', async () => {
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue(null);

    await expect(assertNoOtherOpenPeriod('period-current')).resolves.toBeUndefined();

    expect(mockPrisma.reEnrollmentPeriod.findFirst).toHaveBeenCalledWith({
      where: { status: 'OPEN', id: { not: 'period-current' } },
      select: { id: true, name: true },
    });
  });

  it('should throw PERIOD_ALREADY_OPEN (409) with conflicting period details', async () => {
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue({
      id: 'period-conflict',
      name: 'Rematrícula 2027',
    });

    let captured: any;
    try {
      await assertNoOtherOpenPeriod();
    } catch (err) {
      captured = err;
    }

    expect(captured).toBeDefined();
    expect(captured.statusCode).toBe(409);
    expect(captured.code).toBe('PERIOD_ALREADY_OPEN');
    expect(captured.message).toContain('Já existe uma campanha de rematrícula aberta');
    expect(captured.details).toEqual({
      conflictingPeriodId: 'period-conflict',
      conflictingPeriodName: 'Rematrícula 2027',
    });
  });

  it('should propagate the invariant via transitionPeriod (DRAFT → OPEN)', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-target',
      status: 'DRAFT',
      name: 'Rematrícula 2028',
    });
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue({
      id: 'period-other',
      name: 'Rematrícula 2027',
    });

    let captured: any;
    try {
      await transitionPeriod('period-target', 'OPEN', 'user-1');
    } catch (err) {
      captured = err;
    }

    expect(captured?.code).toBe('PERIOD_ALREADY_OPEN');
    expect(captured?.statusCode).toBe(409);
    expect(mockPrisma.reEnrollmentPeriod.update).not.toHaveBeenCalled();
  });
});

describe('PATCH /periods/:id/transition — single-OPEN invariant integration', () => {
  function buildApp() {
    const app = express();
    app.use(express.json());

    const router = Router();
    router.use((req, _res, next) => {
      (req as any).user = { id: 'user-1', role: 'ADMIN' };
      next();
    });
    router.patch('/periods/:id/transition', ReEnrollmentController.transitionPeriod as any);
    app.use(router);
    app.use(errorHandler);
    return app;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 409 PERIOD_ALREADY_OPEN when another period is already OPEN', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-target',
      status: 'DRAFT',
      name: 'Rematrícula 2028',
    });
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue({
      id: 'period-conflict',
      name: 'Rematrícula 2027',
    });

    const res = await request(buildApp())
      .patch('/periods/period-target/transition')
      .send({ status: 'OPEN' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      success: false,
      code: 'PERIOD_ALREADY_OPEN',
      details: {
        conflictingPeriodId: 'period-conflict',
        conflictingPeriodName: 'Rematrícula 2027',
      },
    });
    expect(mockPrisma.reEnrollmentPeriod.update).not.toHaveBeenCalled();
  });

  it('returns 200 and transitions to OPEN when no other period is OPEN', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({
      id: 'period-target',
      status: 'DRAFT',
      name: 'Rematrícula 2028',
    });
    mockPrisma.reEnrollmentPeriod.findFirst.mockResolvedValue(null);
    mockPrisma.reEnrollmentPeriod.update.mockResolvedValue({
      id: 'period-target',
      status: 'OPEN',
    });

    const res = await request(buildApp())
      .patch('/periods/period-target/transition')
      .send({ status: 'OPEN' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
    expect(mockPrisma.reEnrollmentPeriod.update).toHaveBeenCalledWith({
      where: { id: 'period-target' },
      data: expect.objectContaining({ status: 'OPEN' }),
    });
  });
});
