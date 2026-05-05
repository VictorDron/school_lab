import { vi, describe, it, expect, beforeEach } from 'vitest';

// Tests don't load setup-env.ts before module imports kick in — set
// the bare-minimum env vars here so config/index.ts doesn't throw.
process.env.JWT_SECRET ??= 'test-jwt-secret';

// Mock prisma
vi.mock('../config/database.js', () => ({
  prisma: {
    student: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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
      // Phase 2g: createStudentsFromEnrollment now resolves Lead.tenantId
      // before stamping each Student. Default to a present lead so the
      // pre-2g test fixtures keep passing without needing to wire this
      // up per-case.
      findUnique: vi.fn().mockResolvedValue({ tenantId: 'test-tenant-id' }),
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

vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  runWithTenant: <T>(_id: string, fn: () => T) => fn(),
}));

import { prisma } from '../config/database.js';
import { createStudentsFromEnrollment } from '../services/students/index.js';

describe('createStudentsFromEnrollment (STU-01)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks wipes the default mockResolvedValue installed at
    // mock-creation time; reinstall it so the Lead lookup keeps
    // returning a tenantId for every test.
    mockPrisma.lead.findUnique.mockResolvedValue({ tenantId: 'test-tenant-id' });
  });

  it('should create a Student record for each child where isApplicant is true', async () => {
    const leadId = 'lead-001';

    mockPrisma.leadChild.findMany.mockResolvedValue([
      {
        id: 'child-001',
        leadId,
        fullName: 'Ana Souza',
        cpf: '123.456.789-00',
        dateOfBirth: new Date('2015-06-15'),
        gender: 'F',
        nationality: 'Brasileira',
        desiredGrade: '1A',
        isApplicant: true,
      },
    ]);

    const createdStudent = {
      id: 'student-001',
      code: 'STU-ABCD1234',
      leadId,
      leadChildId: 'child-001',
      fullName: 'Ana Souza',
      status: 'ACTIVE',
      academicYear: new Date().getFullYear(),
    };

    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue(createdStudent);
    mockPrisma.studentHistory.findFirst.mockResolvedValue(null);
    mockPrisma.studentHistory.create.mockResolvedValue({ id: 'hist-001' });

    const result = await createStudentsFromEnrollment(leadId);

    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Ana Souza');
    expect(result[0].leadChildId).toBe('child-001');
    expect(mockPrisma.student.findFirst).toHaveBeenCalledTimes(1);
    expect(mockPrisma.student.create).toHaveBeenCalledTimes(1);
  });

  it('should skip children where isApplicant is false (D-02)', async () => {
    const leadId = 'lead-002';

    // Only applicant children are queried — the where clause filters isApplicant:true
    // so findMany with the correct filter returns an empty array for this test
    mockPrisma.leadChild.findMany.mockResolvedValue([]);

    const result = await createStudentsFromEnrollment(leadId);

    expect(result).toHaveLength(0);
    expect(mockPrisma.student.findFirst).not.toHaveBeenCalled();

    // Verify that the service passes isApplicant: true to the query
    expect(mockPrisma.leadChild.findMany).toHaveBeenCalledWith({
      where: { leadId, isApplicant: true },
    });
  });

  it('should be idempotent — second call does not create duplicate student', async () => {
    const leadId = 'lead-003';

    mockPrisma.leadChild.findMany.mockResolvedValue([
      {
        id: 'child-003',
        leadId,
        fullName: 'Carlos Lima',
        cpf: null,
        dateOfBirth: null,
        gender: 'M',
        nationality: null,
        desiredGrade: '5B',
        isApplicant: true,
      },
    ]);

    const existingStudent = {
      id: 'student-003',
      code: 'STU-EXISTING',
      leadId,
      leadChildId: 'child-003',
      fullName: 'Carlos Lima',
      status: 'ACTIVE',
      academicYear: new Date().getFullYear(),
    };

    // First call: findFirst returns null, so create is called
    mockPrisma.student.findFirst.mockResolvedValueOnce(null);
    mockPrisma.student.create.mockResolvedValue(existingStudent);
    mockPrisma.studentHistory.findFirst.mockResolvedValueOnce(null);
    mockPrisma.studentHistory.create.mockResolvedValue({ id: 'hist-003' });

    await createStudentsFromEnrollment(leadId);

    // Second call: findFirst returns existing student, so create is NOT called again
    mockPrisma.student.findFirst.mockResolvedValueOnce(existingStudent);
    mockPrisma.studentHistory.findFirst.mockResolvedValueOnce({ id: 'hist-003', action: 'STUDENT_CREATED' });

    await createStudentsFromEnrollment(leadId);

    // findFirst called twice, but student.create only once (idempotency)
    expect(mockPrisma.student.findFirst).toHaveBeenCalledTimes(2);
    expect(mockPrisma.student.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.studentHistory.create).toHaveBeenCalledTimes(1);
  });

  it('should generate a student code matching STU-XXXXXX pattern', async () => {
    const leadId = 'lead-004';

    mockPrisma.leadChild.findMany.mockResolvedValue([
      {
        id: 'child-004',
        leadId,
        fullName: 'Maria Fernanda',
        cpf: null,
        dateOfBirth: null,
        gender: 'F',
        nationality: null,
        desiredGrade: '3C',
        isApplicant: true,
      },
    ]);

    const capturedCreateCall: any[] = [];
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockImplementation((args: any) => {
      capturedCreateCall.push(args);
      return Promise.resolve({
        id: 'student-004',
        code: args.data.code,
        leadId,
        leadChildId: 'child-004',
        fullName: 'Maria Fernanda',
        status: 'ACTIVE',
        academicYear: new Date().getFullYear(),
      });
    });
    mockPrisma.studentHistory.findFirst.mockResolvedValue(null);
    mockPrisma.studentHistory.create.mockResolvedValue({ id: 'hist-004' });

    await createStudentsFromEnrollment(leadId);

    expect(capturedCreateCall).toHaveLength(1);
    const generatedCode: string = capturedCreateCall[0].data.code;
    // generateCode('STU') produces STU-{timestamp36}-{nanoid4} —
    // hyphen-delimited segments. Pre-Phase-2g this code path was
    // returning an empty array (Lead lookup wasn't there yet) so this
    // assertion never actually fired; the regex was missing the hyphen.
    expect(generatedCode).toMatch(/^STU-[A-Z0-9_-]+$/);
  });

  it('should set academicYear to the current year', async () => {
    const leadId = 'lead-005';
    const currentYear = new Date().getFullYear();

    mockPrisma.leadChild.findMany.mockResolvedValue([
      {
        id: 'child-005',
        leadId,
        fullName: 'Pedro Alves',
        cpf: null,
        dateOfBirth: null,
        gender: 'M',
        nationality: null,
        desiredGrade: '2A',
        isApplicant: true,
      },
    ]);

    const capturedCreate: any[] = [];
    mockPrisma.student.findFirst.mockResolvedValue(null);
    mockPrisma.student.create.mockImplementation((args: any) => {
      capturedCreate.push(args);
      return Promise.resolve({
        id: 'student-005',
        code: 'STU-TEST005',
        leadId,
        leadChildId: 'child-005',
        fullName: 'Pedro Alves',
        status: 'ACTIVE',
        academicYear: args.data.academicYear,
      });
    });
    mockPrisma.studentHistory.findFirst.mockResolvedValue(null);
    mockPrisma.studentHistory.create.mockResolvedValue({ id: 'hist-005' });

    await createStudentsFromEnrollment(leadId);

    expect(capturedCreate[0].data.academicYear).toBe(currentYear);
  });
});
