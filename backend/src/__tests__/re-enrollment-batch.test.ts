import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, emailServiceMock, auditServiceMock, gradeProgressionMock, cryptoMock, settingsMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentPeriod: {
      findUnique: vi.fn(),
    },
    reEnrollmentInvite: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  const emailServiceMock = {
    sendReEnrollmentInviteEmail: vi.fn(),
  };
  const auditServiceMock = {
    createAuditLog: vi.fn(),
  };
  const gradeProgressionMock = {
    getNextGrade: vi.fn(),
  };
  const cryptoMock = {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'a'.repeat(64)),
    })),
  };
  const settingsMock = {
    getOrCreateSettings: vi.fn().mockResolvedValue({ schoolName: 'Test School' }),
  };
  return { prismaMock, emailServiceMock, auditServiceMock, gradeProgressionMock, cryptoMock, settingsMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('crypto', () => ({
  default: cryptoMock,
  randomBytes: cryptoMock.randomBytes,
}));

vi.mock('../services/email.service.js', () => emailServiceMock);

vi.mock('../services/settings.service.js', () => settingsMock);

vi.mock('../services/tenant.service.js', () => ({
  getDefaultTenant: vi.fn().mockResolvedValue({ id: 'test-tenant-id', slug: 'test', name: 'Test' }),
  DEFAULT_TENANT_ID: 'test-tenant-id',
  DEFAULT_TENANT_SLUG: 'test',
}));

vi.mock('../lib/tenant-context.js', () => ({
  requireTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  currentTenantId: vi.fn().mockReturnValue('test-tenant-id'),
  runWithTenant: <T>(_id: string, fn: () => T) => fn(),
}));

vi.mock('../services/audit.service.js', () => auditServiceMock);

vi.mock('../services/grade-progression.js', () => gradeProgressionMock);

vi.mock('../config/index.js', () => ({
  config: { frontendUrl: 'http://localhost:5173' },
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

import { findEligibleStudents, createBatchInvites } from '../services/re-enrollment-eligibility.service.js';

const mockPeriod = {
  id: 'period-1',
  name: 'Rematricula 2027',
  status: 'OPEN',
  targetYear: 2027,
  eligibleGrades: ['5th Grade', '6th Grade'],
  startDate: new Date('2026-11-01'),
  endDate: new Date('2026-12-15'),
};

function makeStudent(id: string, grade: string, familyName: string, email: string, childName: string) {
  return {
    id,
    grade,
    status: 'ACTIVE',
    academicYear: 2026,
    lead: { id: `lead-${id}`, primaryContactEmail: email, familyName },
    child: { id: `child-${id}`, fullName: childName },
  };
}

// Helper to set up prisma mocks for internal createInvite calls
function setupInviteCreationMocks() {
  // createInvite internally calls: findUnique(period), findUnique(student), findFirst(existing), create(invite)
  // Period is already mocked via mockPeriod for findEligibleStudents
  prismaMock.student.findUnique.mockImplementation(({ where }: any) =>
    Promise.resolve({ id: where.id, fullName: `Student ${where.id}` })
  );
  prismaMock.reEnrollmentInvite.findFirst.mockResolvedValue(null); // no existing invite
  let inviteCounter = 0;
  prismaMock.reEnrollmentInvite.create.mockImplementation(({ data }: any) => {
    inviteCounter++;
    return Promise.resolve({
      id: `inv-${data.studentId}`,
      token: 'a'.repeat(64),
      periodId: data.periodId,
      studentId: data.studentId,
      status: 'SENT',
      sentAt: new Date(),
      gateStatus: 'CONVITE_ENVIADO',
    });
  });
  // updateInviteStatus and updateInviteEmailStatus use prisma.reEnrollmentInvite.update
  prismaMock.reEnrollmentInvite.update.mockResolvedValue({});
}

describe('findEligibleStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ACTIVE students with matching grade and academicYear', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
      makeStudent('s2', '6th Grade', 'Santos', 'santos@test.com', 'Pedro Santos'),
      makeStudent('s3', '5th Grade', 'Costa', 'costa@test.com', 'Maria Costa'),
    ];

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    // First call: already-promoted students (empty), second call: eligible students
    prismaMock.student.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(students);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

    const result = await findEligibleStudents('period-1');

    expect(result.eligible).toHaveLength(3);
    expect(result.alreadyInvited).toBe(0);
    expect(prismaMock.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'ACTIVE',
          academicYear: 2026,
          grade: { in: ['5th Grade', '6th Grade'] },
        },
      })
    );
  });

  it('should exclude students already invited for the period', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
      makeStudent('s2', '6th Grade', 'Santos', 'santos@test.com', 'Pedro Santos'),
      makeStudent('s3', '5th Grade', 'Costa', 'costa@test.com', 'Maria Costa'),
    ];

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(students);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([{ studentId: 's1' }]);

    const result = await findEligibleStudents('period-1');

    expect(result.eligible).toHaveLength(2);
    expect(result.eligible.map((s: any) => s.id)).toEqual(['s2', 's3']);
    expect(result.alreadyInvited).toBe(1);
  });

  it('should return empty when no eligible students', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

    const result = await findEligibleStudents('period-1');

    expect(result.eligible).toHaveLength(0);
    expect(result.alreadyInvited).toBe(0);
  });

  it('should throw PERIOD_NOT_FOUND when period does not exist', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(null);

    await expect(findEligibleStudents('nonexistent')).rejects.toThrow(
      'Campanha de rematrícula não encontrada.'
    );
  });

  it('should throw BATCH_PERIOD_NOT_OPEN when period is not OPEN', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({ ...mockPeriod, status: 'DRAFT' });

    await expect(findEligibleStudents('period-1')).rejects.toThrow(
      'A campanha deve estar aberta para enviar convites.'
    );
  });
});

describe('createBatchInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);
    gradeProgressionMock.getNextGrade.mockReturnValue('6th Grade');
    auditServiceMock.createAuditLog.mockResolvedValue(undefined);
    setupInviteCreationMocks();
  });

  it('should create invites in batches of 5', async () => {
    const students = Array.from({ length: 7 }, (_, i) =>
      makeStudent(`s${i}`, '5th Grade', `Family${i}`, `f${i}@test.com`, `Child${i}`)
    );

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    await createBatchInvites('period-1', 'user-1');

    expect(prismaMock.reEnrollmentInvite.create).toHaveBeenCalledTimes(7);
  });

  it('should send email for each created invite', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
      makeStudent('s2', '6th Grade', 'Santos', 'santos@test.com', 'Pedro Santos'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    await createBatchInvites('period-1', 'user-1');

    expect(emailServiceMock.sendReEnrollmentInviteEmail).toHaveBeenCalledTimes(2);
    expect(emailServiceMock.sendReEnrollmentInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'silva@test.com',
        studentName: 'Ana Silva',
        formLink: expect.stringContaining('a'.repeat(64)),
      })
    );
  });

  it('should skip already-invited students', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([{ studentId: 's1' }]);
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    const result = await createBatchInvites('period-1', 'user-1');

    expect(prismaMock.reEnrollmentInvite.create).not.toHaveBeenCalled();
    expect(result.created).toBe(0);
    expect(result.alreadyInvited).toBe(1);
  });

  it('should continue batch when email send fails for one invite', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
      makeStudent('s2', '6th Grade', 'Santos', 'santos@test.com', 'Pedro Santos'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    emailServiceMock.sendReEnrollmentInviteEmail
      .mockRejectedValueOnce(new Error('SMTP failure'))
      .mockResolvedValueOnce(undefined);

    const result = await createBatchInvites('period-1', 'user-1');

    expect(result.failed).toBe(1);
    expect(result.created).toBe(1);
    expect(prismaMock.reEnrollmentInvite.create).toHaveBeenCalledTimes(2);
  });

  it('should return summary with created, failed, alreadyInvited counts', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
      makeStudent('s2', '6th Grade', 'Santos', 'santos@test.com', 'Pedro Santos'),
      makeStudent('s3', '5th Grade', 'Costa', 'costa@test.com', 'Maria Costa'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([{ studentId: 's3' }]);
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    const result = await createBatchInvites('period-1', 'user-1');

    expect(result.created).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.alreadyInvited).toBe(1);
    expect(result.total).toBe(3);
  });

  it('should include suggestedGrade from getNextGrade in email', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    gradeProgressionMock.getNextGrade.mockReturnValue('6th Grade');
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    await createBatchInvites('period-1', 'user-1');

    expect(gradeProgressionMock.getNextGrade).toHaveBeenCalledWith('5th Grade');
    expect(emailServiceMock.sendReEnrollmentInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestedGrade: '6th Grade',
      })
    );
  });

  it('should create audit log entry for batch invite', async () => {
    const students = [
      makeStudent('s1', '5th Grade', 'Silva', 'silva@test.com', 'Ana Silva'),
    ];

    prismaMock.student.findMany
      .mockResolvedValueOnce([]) // already-promoted query
      .mockResolvedValueOnce(students);
    emailServiceMock.sendReEnrollmentInviteEmail.mockResolvedValue(undefined);

    await createBatchInvites('period-1', 'user-1');

    expect(auditServiceMock.createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        action: 'RE_ENROLLMENT_INVITE_SENT',
        entityType: 'RE_ENROLLMENT_PERIOD',
        entityId: 'period-1',
      })
    );
  });
});
