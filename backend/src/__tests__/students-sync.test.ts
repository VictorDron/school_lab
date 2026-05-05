/**
 * Idempotency and bidirectionality guarantees for the Student ↔ LeadChild
 * sync module that wave 1 isolated into students/students-sync.service.ts.
 *
 * Mocks Prisma to assert that:
 *  - createStudentsFromEnrollment: running twice for the same lead does not
 *    create a second Student or a second STUDENT_CREATED history row;
 *  - createStudentFromReEnrollment: running twice for the same (child, year)
 *    returns the existing record without creating duplicates;
 *  - syncLeadChildToStudents: only sends fields present in the SYNC_FIELDS
 *    allowlist, and skips the round-trip entirely when the change set is
 *    empty;
 *  - syncStudentToLeadChild: same allowlist semantics, propagating to the
 *    parent LeadChild.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../config/database.js', () => ({
  prisma: {
    leadChild: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    studentHistory: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('../config/redis.js', () => ({
  redis: { publish: vi.fn().mockResolvedValue(1) },
}));

vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from '../config/database.js';
import {
  createStudentsFromEnrollment,
  createStudentFromReEnrollment,
  syncLeadChildToStudents,
  syncStudentToLeadChild,
} from '../services/students/students-sync.service.js';

const mockPrisma = prisma as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createStudentsFromEnrollment — idempotency', () => {
  it('does not create a duplicate Student on the second call', async () => {
    const child = {
      id: 'child-1',
      leadId: 'lead-1',
      isApplicant: true,
      fullName: 'Ana Souza',
      desiredGrade: '1st Grade',
      dateOfBirth: null,
      cpf: null,
      gender: null,
      nationality: null,
    };

    mockPrisma.leadChild.findMany.mockResolvedValue([child]);

    // First call: no existing student → create.
    mockPrisma.student.findFirst.mockResolvedValueOnce(null);
    mockPrisma.student.create.mockResolvedValueOnce({
      id: 'student-1',
      leadChildId: child.id,
      academicYear: new Date().getFullYear(),
    });
    mockPrisma.studentHistory.findFirst.mockResolvedValueOnce(null);

    await createStudentsFromEnrollment('lead-1', 'actor-1');

    expect(mockPrisma.student.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledTimes(1);

    // Second call: student already exists → no create, no history.
    mockPrisma.student.findFirst.mockResolvedValueOnce({
      id: 'student-1',
      leadChildId: child.id,
      academicYear: new Date().getFullYear(),
    });
    mockPrisma.studentHistory.findFirst.mockResolvedValueOnce({
      id: 'hist-1',
    });

    await createStudentsFromEnrollment('lead-1', 'actor-1');

    expect(mockPrisma.student.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledTimes(1);
  });

  it('skips children where isApplicant=false', async () => {
    mockPrisma.leadChild.findMany.mockResolvedValue([]);
    const result = await createStudentsFromEnrollment('lead-1');
    expect(result).toEqual([]);
    expect(mockPrisma.student.create).not.toHaveBeenCalled();
    // Confirm the where clause filters by isApplicant
    expect(mockPrisma.leadChild.findMany).toHaveBeenCalledWith({
      where: { leadId: 'lead-1', isApplicant: true },
    });
  });
});

describe('createStudentFromReEnrollment — idempotency', () => {
  const baseStudent = {
    id: 'student-old',
    leadId: 'lead-1',
    leadChildId: 'child-1',
    fullName: 'Ana Souza',
    dateOfBirth: null,
    cpf: null,
    gender: null,
    nationality: null,
    grade: '5th Grade',
  };

  it('returns the existing student instead of creating when one already exists for (child, year)', async () => {
    mockPrisma.student.findFirst.mockResolvedValue({
      id: 'student-existing',
      leadChildId: 'child-1',
      academicYear: 2027,
    });

    const result = await createStudentFromReEnrollment(
      baseStudent,
      2027,
      '6th Grade',
    );

    expect(result.id).toBe('student-existing');
    expect(mockPrisma.student.create).not.toHaveBeenCalled();
    expect(mockPrisma.studentHistory.create).not.toHaveBeenCalled();
  });

  it('creates a new student plus two history rows when no record exists for the target year', async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue({
      id: 'student-new',
      leadChildId: 'child-1',
      academicYear: 2027,
    });

    await createStudentFromReEnrollment(baseStudent, 2027, '6th Grade');

    expect(mockPrisma.student.create).toHaveBeenCalledTimes(1);
    // One row for STUDENT_CREATED on the new student, one for RE_ENROLLED on the old.
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledTimes(2);
  });
});

describe('syncLeadChildToStudents — bidirectionality + allowlist', () => {
  it('updates active students with the allowlisted fields only', async () => {
    mockPrisma.student.findMany.mockResolvedValue([{ id: 'student-1' }]);
    mockPrisma.student.updateMany.mockResolvedValue({ count: 1 });

    await syncLeadChildToStudents('child-1', {
      fullName: 'Novo Nome',
      cpf: '11122233344',
      // The next two are NOT in SYNC_FIELDS and must be ignored.
      desiredGrade: 'XYZ',
      relationship: 'son',
    });

    expect(mockPrisma.student.updateMany).toHaveBeenCalledTimes(1);
    const args = mockPrisma.student.updateMany.mock.calls[0][0];
    expect(args.data).toEqual({
      fullName: 'Novo Nome',
      cpf: '11122233344',
    });
    expect(args.where).toEqual({ leadChildId: 'child-1', status: 'ACTIVE' });
  });

  it('is a no-op when no allowlisted field changed', async () => {
    await syncLeadChildToStudents('child-1', { desiredGrade: 'New Grade' });
    expect(mockPrisma.student.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.student.updateMany).not.toHaveBeenCalled();
  });

  it('is a no-op when no active students are linked to the child', async () => {
    mockPrisma.student.findMany.mockResolvedValue([]);
    await syncLeadChildToStudents('child-1', { fullName: 'X' });
    expect(mockPrisma.student.updateMany).not.toHaveBeenCalled();
  });
});

describe('syncStudentToLeadChild — bidirectionality + allowlist', () => {
  it('updates the parent LeadChild with allowlisted fields only', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ leadChildId: 'child-1' });
    mockPrisma.leadChild.update.mockResolvedValue({});

    await syncStudentToLeadChild('student-1', {
      fullName: 'Novo Nome',
      grade: '5th Grade', // NOT in SYNC_FIELDS, must be filtered out.
      gender: 'F',
    });

    expect(mockPrisma.leadChild.update).toHaveBeenCalledTimes(1);
    const args = mockPrisma.leadChild.update.mock.calls[0][0];
    expect(args.data).toEqual({ fullName: 'Novo Nome', gender: 'F' });
    expect(args.where).toEqual({ id: 'child-1' });
  });

  it('does not call Prisma when nothing in the allowlist changed', async () => {
    await syncStudentToLeadChild('student-1', { grade: '5th Grade' });
    expect(mockPrisma.student.findUnique).not.toHaveBeenCalled();
    expect(mockPrisma.leadChild.update).not.toHaveBeenCalled();
  });

  it('is a no-op when the student does not exist', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);
    await syncStudentToLeadChild('student-1', { fullName: 'Novo' });
    expect(mockPrisma.leadChild.update).not.toHaveBeenCalled();
  });
});
