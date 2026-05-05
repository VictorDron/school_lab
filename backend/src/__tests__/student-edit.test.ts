import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../services/audit.service.js', () => ({ createAuditLog: vi.fn() }));
// Phase 6: bypass GUC plumbing — invoke the callback with the mocked
// prisma so test assertions on student.update / studentHistory.create
// stay valid.
vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  withTenantTx: <T>(p: any, fn: (tx: any) => Promise<T>) => fn(p),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import { updateStudent } from '../services/students/index.js';
import { createAuditLog } from '../services/audit.service.js';
import { getIO } from '../socket/io.js';
import { AppError } from '../middlewares/errorHandler.js';

describe('updateStudent (EDIT-01)', () => {
  const mockPrisma = prisma as any;
  const mockCreateAuditLog = createAuditLog as any;
  const mockGetIO = getIO as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should change fullName and create history with field-level diff', async () => {
    const existingStudent = {
      id: 'std-001',
      fullName: 'Ana',
      grade: '5th Grade',
      academicYear: 2026,
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
      status: 'ACTIVE',
      leadId: 'lead-001',
    };

    const updatedStudent = { ...existingStudent, fullName: 'Ana Maria' };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    const result = await updateStudent('std-001', { fullName: 'Ana Maria' }, 'actor-001');

    expect(result.fullName).toBe('Ana Maria');
    expect(mockPrisma.student.update).toHaveBeenCalledTimes(1);

    // Verify history records field-level diff
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        studentId: 'std-001',
        action: 'DATA_UPDATED',
        details: expect.objectContaining({
          changes: expect.objectContaining({
            fullName: { from: 'Ana', to: 'Ana Maria' },
          }),
        }),
        actorId: 'actor-001',
      }),
    });
  });

  it('should change multiple fields and record all changes', async () => {
    const existingStudent = {
      id: 'std-002',
      fullName: 'Bruno Lima',
      grade: '5th Grade',
      academicYear: 2025,
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
      status: 'ACTIVE',
      leadId: 'lead-002',
    };

    const updatedStudent = { ...existingStudent, grade: '6th Grade', academicYear: 2026 };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    const result = await updateStudent(
      'std-002',
      { grade: '6th Grade', academicYear: 2026 },
      'actor-002'
    );

    expect(result.grade).toBe('6th Grade');
    expect(result.academicYear).toBe(2026);

    expect(mockPrisma.studentHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: expect.objectContaining({
          changes: expect.objectContaining({
            grade: { from: '5th Grade', to: '6th Grade' },
            academicYear: { from: 2025, to: 2026 },
          }),
          fieldCount: 2,
        }),
      }),
    });
  });

  it('should return student without creating history when no fields actually changed', async () => {
    const existingStudent = {
      id: 'std-003',
      fullName: 'Ana',
      grade: '5th Grade',
      academicYear: 2026,
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
      status: 'ACTIVE',
      leadId: 'lead-003',
    };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);

    const result = await updateStudent(
      'std-003',
      { fullName: 'Ana', grade: '5th Grade' },
      'actor-003'
    );

    expect(result.fullName).toBe('Ana');
    expect(mockPrisma.student.update).not.toHaveBeenCalled();
    expect(mockPrisma.studentHistory.create).not.toHaveBeenCalled();
  });

  it('should throw STUDENT_NOT_FOUND (404) for nonexistent student', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);

    await expect(
      updateStudent('nonexistent-id', { fullName: 'Test' }, 'actor-001')
    ).rejects.toThrow(AppError);

    try {
      await updateStudent('nonexistent-id', { fullName: 'Test' }, 'actor-001');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      const appErr = err as AppError;
      expect(appErr.statusCode).toBe(404);
      expect(appErr.code).toBe('STUDENT_NOT_FOUND');
    }
  });

  it('should create audit log entry with action STUDENT_UPDATED', async () => {
    const existingStudent = {
      id: 'std-004',
      fullName: 'Clara',
      grade: '3rd Grade',
      academicYear: 2026,
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
      status: 'ACTIVE',
      leadId: 'lead-004',
    };

    const updatedStudent = { ...existingStudent, fullName: 'Clara Mendes' };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    await updateStudent('std-004', { fullName: 'Clara Mendes' }, 'actor-004');

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'actor-004',
        action: 'STUDENT_UPDATED',
        entityType: 'Student',
        entityId: 'std-004',
        metadata: expect.objectContaining({
          changes: expect.objectContaining({
            fullName: { from: 'Clara', to: 'Clara Mendes' },
          }),
        }),
      })
    );
  });

  it('should emit socket event students:list:updated', async () => {
    const existingStudent = {
      id: 'std-005',
      fullName: 'Diego',
      grade: '7th Grade',
      academicYear: 2026,
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
      status: 'ACTIVE',
      leadId: 'lead-005',
    };

    const updatedStudent = { ...existingStudent, fullName: 'Diego Santos' };

    mockPrisma.student.findUnique.mockResolvedValue(existingStudent);
    mockPrisma.student.update.mockResolvedValue(updatedStudent);

    const mockEmit = vi.fn();
    const mockTo = vi.fn(() => ({ emit: mockEmit }));
    mockGetIO.mockReturnValue({ to: mockTo });

    await updateStudent('std-005', { fullName: 'Diego Santos' }, 'actor-005');

    expect(mockTo).toHaveBeenCalledWith('students:list');
    expect(mockEmit).toHaveBeenCalledWith('students:list:updated', {
      type: 'student:updated',
      studentId: 'std-005',
    });
  });
});
