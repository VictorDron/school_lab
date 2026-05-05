import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
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
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import { getStudentDashboardStats } from '../services/students/index.js';

describe('getStudentDashboardStats (EDIT-02)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return total count', async () => {
    mockPrisma.student.count.mockResolvedValue(42);
    mockPrisma.student.groupBy.mockResolvedValue([]);

    const result = await getStudentDashboardStats();

    expect(result.total).toBe(42);
  });

  it('should return byStatus with _count per status', async () => {
    mockPrisma.student.count.mockResolvedValue(100);
    mockPrisma.student.groupBy
      .mockResolvedValueOnce([
        { status: 'ACTIVE', _count: { id: 80 } },
        { status: 'INACTIVE', _count: { id: 15 } },
        { status: 'GRADUATED', _count: { id: 5 } },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await getStudentDashboardStats();

    expect(result.byStatus).toEqual([
      { status: 'ACTIVE', _count: { id: 80 } },
      { status: 'INACTIVE', _count: { id: 15 } },
      { status: 'GRADUATED', _count: { id: 5 } },
    ]);
  });

  it('should return byGrade with _count per grade', async () => {
    mockPrisma.student.count.mockResolvedValue(50);
    mockPrisma.student.groupBy
      .mockResolvedValueOnce([]) // byStatus
      .mockResolvedValueOnce([
        { grade: '5th Grade', _count: { id: 20 } },
        { grade: '6th Grade', _count: { id: 15 } },
        { grade: 'Kindergarten', _count: { id: 15 } },
      ])
      .mockResolvedValueOnce([]); // byAcademicYear

    const result = await getStudentDashboardStats();

    expect(result.byGrade).toEqual([
      { grade: '5th Grade', _count: { id: 20 } },
      { grade: '6th Grade', _count: { id: 15 } },
      { grade: 'Kindergarten', _count: { id: 15 } },
    ]);
  });

  it('should filter out dirty grade data (person names, medications, nulls)', async () => {
    mockPrisma.student.count.mockResolvedValue(60);
    mockPrisma.student.groupBy
      .mockResolvedValueOnce([]) // byStatus
      .mockResolvedValueOnce([
        { grade: '5th Grade', _count: { id: 20 } },
        { grade: 'João da Silva', _count: { id: 3 } },
        { grade: 'Kindergarten', _count: { id: 15 } },
        { grade: 'Paracetamol 500mg', _count: { id: 1 } },
        { grade: null, _count: { id: 5 } },
        { grade: '12th Grade', _count: { id: 10 } },
        { grade: 'INVALID_GRADE', _count: { id: 2 } },
      ])
      .mockResolvedValueOnce([]); // byAcademicYear

    const result = await getStudentDashboardStats();

    expect(result.byGrade).toEqual([
      { grade: '5th Grade', _count: { id: 20 } },
      { grade: 'Kindergarten', _count: { id: 15 } },
      { grade: '12th Grade', _count: { id: 10 } },
    ]);
    expect(result.byGrade).toHaveLength(3);
  });

  it('should return byAcademicYear with _count per year', async () => {
    mockPrisma.student.count.mockResolvedValue(200);
    mockPrisma.student.groupBy
      .mockResolvedValueOnce([]) // byStatus
      .mockResolvedValueOnce([]) // byGrade
      .mockResolvedValueOnce([
        { academicYear: 2026, _count: { id: 120 } },
        { academicYear: 2025, _count: { id: 80 } },
      ]);

    const result = await getStudentDashboardStats();

    expect(result.byAcademicYear).toEqual([
      { academicYear: 2026, _count: { id: 120 } },
      { academicYear: 2025, _count: { id: 80 } },
    ]);
  });

  it('should pass academicYear filter to count and groupBy when provided', async () => {
    mockPrisma.student.count.mockResolvedValue(120);
    mockPrisma.student.groupBy.mockResolvedValue([]);

    await getStudentDashboardStats({ academicYear: 2026 });

    // count should have where with academicYear
    expect(mockPrisma.student.count).toHaveBeenCalledWith({
      where: { academicYear: 2026 },
    });

    // byStatus groupBy should have where with academicYear
    expect(mockPrisma.student.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['status'],
        where: { academicYear: 2026 },
      })
    );

    // byGrade groupBy should have where with academicYear
    expect(mockPrisma.student.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['grade'],
        where: { academicYear: 2026 },
      })
    );
  });

  it('should use empty where when no filter provided', async () => {
    mockPrisma.student.count.mockResolvedValue(42);
    mockPrisma.student.groupBy.mockResolvedValue([]);

    await getStudentDashboardStats();

    expect(mockPrisma.student.count).toHaveBeenCalledWith({
      where: {},
    });
  });
});
