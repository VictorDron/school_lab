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
    leadEnrollmentDocument: {
      findMany: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
    },
    reEnrollmentInvite: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({ getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })) }));
vi.mock('./audit.service.js', () => ({ createAuditLog: vi.fn() }));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import { findMany } from '../services/students/index.js';

describe('findMany (STU-02)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.leadEnrollmentDocument.findMany.mockResolvedValue([]);
    mockPrisma.contract.findMany.mockResolvedValue([]);
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([]);
  });

  it('should return paginated results with total count', async () => {
    const students = [
      { id: 'std-1', fullName: 'Ana', grade: '1A', academicYear: 2025, status: 'ACTIVE', leadId: 'lead-1' },
      { id: 'std-2', fullName: 'Bruno', grade: '2B', academicYear: 2025, status: 'ACTIVE', leadId: 'lead-2' },
    ];
    mockPrisma.student.findMany.mockResolvedValue(students);
    mockPrisma.student.count.mockResolvedValue(2);

    const result = await findMany({}, { page: 1, limit: 25, skip: 0 });

    expect(result.students).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.totalPages).toBe(1);
  });

  it('should filter results by grade', async () => {
    const filteredStudents = [
      { id: 'std-3', fullName: 'Clara', grade: '3C', academicYear: 2025, status: 'ACTIVE', leadId: 'lead-3' },
    ];
    mockPrisma.student.findMany.mockResolvedValue(filteredStudents);
    mockPrisma.student.count.mockResolvedValue(1);

    await findMany({ grade: '3C' }, { page: 1, limit: 25, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.where.grade).toBe('3C');
  });

  it('should filter results by academicYear', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);

    await findMany({ academicYear: 2025 }, { page: 1, limit: 25, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.where.academicYear).toBe(2025);
  });

  it('should filter results by status', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);

    await findMany({ status: 'INACTIVE' as any }, { page: 1, limit: 25, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.where.status).toBe('INACTIVE');
  });

  it('should search fullName case-insensitively', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);

    await findMany({ search: 'ana' }, { page: 1, limit: 25, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fullName: { contains: 'ana', mode: 'insensitive' } }),
      ])
    );
  });

  it('should search by student code', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);

    await findMany({ search: 'STU-ABC' }, { page: 1, limit: 25, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: { contains: 'STU-ABC', mode: 'insensitive' } }),
      ])
    );
  });

  it('should respect the limit passed in pagination params (MAX_LIMIT enforcement)', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    mockPrisma.student.count.mockResolvedValue(0);

    // Caller is responsible for capping at MAX_LIMIT before calling findMany;
    // findMany passes take directly from pagination.limit
    await findMany({}, { page: 1, limit: 100, skip: 0 });

    const findManyCall = mockPrisma.student.findMany.mock.calls[0][0];
    expect(findManyCall.take).toBe(100);
  });

  it('should compute totalPages correctly for multi-page results', async () => {
    mockPrisma.student.findMany.mockResolvedValue(Array(10).fill({ id: 'x' }));
    mockPrisma.student.count.mockResolvedValue(55);

    const result = await findMany({}, { page: 2, limit: 10, skip: 10 });

    expect(result.totalPages).toBe(6);
    expect(result.page).toBe(2);
  });
});
