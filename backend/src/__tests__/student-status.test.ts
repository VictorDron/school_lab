import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    studentHistory: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    leadChild: {
      findMany: vi.fn(),
    },
    lead: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({ getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })) }));
vi.mock('../services/audit.service.js', () => ({ createAuditLog: vi.fn() }));
// Phase 6: bypass GUC plumbing — delegate to mocked $transaction so the
// existing test setup keeps intercepting tx calls.
vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  // Treat the mocked prisma as the tx — the callback's tx.X.method calls
  // land on the same fn() the test asserts against.
  withTenantTx: <T>(p: any, fn: (tx: any) => Promise<T>) => fn(p),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import { updateStatus } from '../services/students/index.js';
import { AppError } from '../middlewares/errorHandler.js';

describe('updateStatus (STU-03)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change student status when student exists', async () => {
    const existingStudent = {
      id: 'std-001',
      fullName: 'Ana Souza',
      status: 'ACTIVE',
      leadId: 'lead-001',
      leadChildId: 'child-001',
    };

    const updatedStudent = { ...existingStudent, status: 'INACTIVE' };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    const result = await updateStatus('std-001', 'INACTIVE' as any, 'actor-001', 'Mudança administrativa');

    expect(result.status).toBe('INACTIVE');
    expect(mockPrisma.student.update).toHaveBeenCalledTimes(1);
  });

  it('should create StudentHistory entry with previousStatus, newStatus, and reason', async () => {
    const existingStudent = {
      id: 'std-002',
      fullName: 'Bruno Lima',
      status: 'ACTIVE',
      leadId: 'lead-002',
      leadChildId: 'child-002',
    };

    const updatedStudent = { ...existingStudent, status: 'TRANSFERRED' };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    await updateStatus('std-002', 'TRANSFERRED' as any, 'actor-002', 'Transferência para outra escola');

    // Verify student.update was called with new status
    expect(mockPrisma.student.update).toHaveBeenCalledWith({
      where: { id: 'std-002' },
      data: { status: 'TRANSFERRED' },
    });

    // Verify studentHistory.create was called with correct details
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'std-002',
        action: 'STATUS_CHANGED',
        details: expect.objectContaining({
          previousStatus: 'ACTIVE',
          newStatus: 'TRANSFERRED',
          reason: 'Transferência para outra escola',
        }),
        actorId: 'actor-002',
      }),
    });
  });

  it('should throw STUDENT_NOT_FOUND (404) for nonexistent student', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);

    await expect(updateStatus('nonexistent-id', 'INACTIVE' as any, 'actor-001')).rejects.toThrow(AppError);

    try {
      await updateStatus('nonexistent-id', 'INACTIVE' as any, 'actor-001');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(404);
      expect(appErr.code).toBe('STUDENT_NOT_FOUND');
    }
  });

  it('should include actorId and reason in the history entry', async () => {
    const existingStudent = {
      id: 'std-003',
      fullName: 'Clara Mendes',
      status: 'ACTIVE',
      leadId: 'lead-003',
      leadChildId: 'child-003',
    };

    const updatedStudent = { ...existingStudent, status: 'GRADUATED' };
    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    await updateStatus('std-003', 'GRADUATED' as any, 'actor-xyz', 'Formatura');

    // Verify the student update + history create both ran inside withTenantTx
    expect(mockPrisma.student.update).toHaveBeenCalledTimes(1);

    // Verify student.update was called with new status
    expect(mockPrisma.student.update).toHaveBeenCalledWith({
      where: { id: 'std-003' },
      data: { status: 'GRADUATED' },
    });

    // Verify studentHistory.create captured the correct details
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'std-003',
        action: 'STATUS_CHANGED',
        details: expect.objectContaining({
          previousStatus: 'ACTIVE',
          newStatus: 'GRADUATED',
          reason: 'Formatura',
        }),
        actorId: 'actor-xyz',
      }),
    });
  });
});
