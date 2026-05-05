import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, cryptoMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    reEnrollmentPeriod: {
      findUnique: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  const cryptoMock = {
    randomBytes: vi.fn(() => ({
      toString: vi.fn(() => 'a'.repeat(64)),
    })),
  };
  return { prismaMock, cryptoMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('crypto', () => ({
  default: cryptoMock,
  randomBytes: cryptoMock.randomBytes,
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createInvite, findInviteByToken as findByToken, updateInviteStatus as updateStatus, findManyInvitesByPeriod as findManyByPeriod } from '../services/re-enrollment-invite.service.js';

describe('ReEnrollment Invite - createInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create invite with unique token and PENDING status', async () => {
    const mockPeriod = { id: 'period-1', status: 'OPEN', name: 'Rematrícula 2026' };
    const mockStudent = { id: 'student-1', fullName: 'Maria Silva' };

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findUnique.mockResolvedValue(mockStudent);
    prismaMock.reEnrollmentInvite.findFirst.mockResolvedValue(null);
    prismaMock.reEnrollmentInvite.create.mockResolvedValue({
      id: 'invite-1',
      periodId: 'period-1',
      studentId: 'student-1',
      token: 'a'.repeat(64),
      status: 'SENT',
      sentAt: new Date(),
      gateStatus: 'CONVITE_ENVIADO',
    });

    const result = await createInvite('period-1', 'student-1');

    expect(result.status).toBe('SENT');
    expect(result.token).toBe('a'.repeat(64));
    expect(prismaMock.reEnrollmentInvite.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        periodId: 'period-1',
        studentId: 'student-1',
        token: 'a'.repeat(64),
        status: 'SENT',
        sentAt: expect.any(Date),
        gateStatus: 'CONVITE_ENVIADO',
      }),
    });
  });

  it('should create invite with CONVITE_ENVIADO gate status', async () => {
    const mockPeriod = { id: 'period-1', status: 'OPEN', name: 'Rematrícula 2026' };
    const mockStudent = { id: 'student-1', fullName: 'Maria Silva' };

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findUnique.mockResolvedValue(mockStudent);
    prismaMock.reEnrollmentInvite.findFirst.mockResolvedValue(null);
    prismaMock.reEnrollmentInvite.create.mockResolvedValue({
      id: 'invite-1',
      periodId: 'period-1',
      studentId: 'student-1',
      token: 'a'.repeat(64),
      status: 'PENDING',
      gateStatus: 'CONVITE_ENVIADO',
    });

    const result = await createInvite('period-1', 'student-1');

    expect(result.gateStatus).toBe('CONVITE_ENVIADO');
  });

  it('should throw PERIOD_NOT_FOUND if period does not exist', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(null);

    await expect(createInvite('nonexistent', 'student-1')).rejects.toThrow(
      'Campanha de rematrícula não encontrada.'
    );
  });

  it('should throw PERIOD_NOT_OPEN if period status is not OPEN', async () => {
    const mockPeriod = { id: 'period-1', status: 'DRAFT', name: 'Rematrícula 2026' };
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);

    await expect(createInvite('period-1', 'student-1')).rejects.toThrow(
      'A campanha de rematrícula não está aberta.'
    );
  });

  it('should throw STUDENT_NOT_FOUND if student does not exist', async () => {
    const mockPeriod = { id: 'period-1', status: 'OPEN', name: 'Rematrícula 2026' };
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findUnique.mockResolvedValue(null);

    await expect(createInvite('period-1', 'nonexistent')).rejects.toThrow(
      'Aluno não encontrado.'
    );
  });

  it('should throw INVITE_ALREADY_EXISTS if duplicate student+period', async () => {
    const mockPeriod = { id: 'period-1', status: 'OPEN', name: 'Rematrícula 2026' };
    const mockStudent = { id: 'student-1', fullName: 'Maria Silva' };
    const existingInvite = { id: 'invite-existing', periodId: 'period-1', studentId: 'student-1' };

    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.student.findUnique.mockResolvedValue(mockStudent);
    prismaMock.reEnrollmentInvite.findFirst.mockResolvedValue(existingInvite);

    await expect(createInvite('period-1', 'student-1')).rejects.toThrow(
      'Já existe um convite para este aluno nesta campanha.'
    );
  });
});

describe('ReEnrollment Invite - findByToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return invite with student and period data', async () => {
    const mockInvite = {
      id: 'invite-1',
      token: 'abc123',
      status: 'PENDING',
      gateStatus: 'CONVITE_ENVIADO',
      student: { id: 'student-1', fullName: 'Maria Silva' },
      period: { id: 'period-1', name: 'Rematrícula 2026' },
    };

    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(mockInvite);

    const result = await findByToken('abc123');

    expect(result).toEqual(mockInvite);
    expect(prismaMock.reEnrollmentInvite.findUnique).toHaveBeenCalledWith({
      where: { token: 'abc123' },
      include: { student: true, period: true },
    });
  });

  it('should throw INVITE_NOT_FOUND for invalid token', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(null);

    await expect(findByToken('invalid-token')).rejects.toThrow(
      'Convite de rematrícula não encontrado.'
    );
  });
});

describe('ReEnrollment Invite - updateStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set sentAt when status changes to SENT', async () => {
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'invite-1',
      status: 'SENT',
      sentAt: new Date(),
    });

    await updateStatus('invite-1', 'SENT');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: {
        status: 'SENT',
        sentAt: expect.any(Date),
      },
    });
  });

  it('should set openedAt when status changes to OPENED', async () => {
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'invite-1',
      status: 'OPENED',
      openedAt: new Date(),
    });

    await updateStatus('invite-1', 'OPENED');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: {
        status: 'OPENED',
        openedAt: expect.any(Date),
      },
    });
  });

  it('should set confirmedAt when status changes to CONFIRMED', async () => {
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'invite-1',
      status: 'CONFIRMED',
      confirmedAt: new Date(),
    });

    await updateStatus('invite-1', 'CONFIRMED');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: {
        status: 'CONFIRMED',
        confirmedAt: expect.any(Date),
      },
    });
  });

  it('should set declinedAt when status changes to DECLINED', async () => {
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'invite-1',
      status: 'DECLINED',
      declinedAt: new Date(),
    });

    await updateStatus('invite-1', 'DECLINED');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: {
        status: 'DECLINED',
        declinedAt: expect.any(Date),
      },
    });
  });

  it('should set expiredAt when status changes to EXPIRED', async () => {
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'invite-1',
      status: 'EXPIRED',
      expiredAt: new Date(),
    });

    await updateStatus('invite-1', 'EXPIRED');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: {
        status: 'EXPIRED',
        expiredAt: expect.any(Date),
      },
    });
  });
});

describe('ReEnrollment Invite - findManyByPeriod', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated invite list with student data', async () => {
    const mockInvites = [
      {
        id: 'invite-1',
        status: 'PENDING',
        gateStatus: 'CONVITE_ENVIADO',
        student: { id: 'student-1', fullName: 'Maria Silva' },
      },
      {
        id: 'invite-2',
        status: 'SENT',
        gateStatus: 'CONVITE_ENVIADO',
        student: { id: 'student-2', fullName: 'Joao Santos' },
      },
    ];

    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue(mockInvites);
    prismaMock.reEnrollmentInvite.count.mockResolvedValue(2);

    const result = await findManyByPeriod('period-1', {}, { page: 1, limit: 25 });

    expect(result.data).toEqual(mockInvites);
    expect(result.total).toBe(2);
    expect(prismaMock.reEnrollmentInvite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { periodId: 'period-1' },
        include: {
          student: {
            include: {
              lead: {
                select: expect.objectContaining({
                  id: true,
                  contracts: expect.objectContaining({
                    where: { enrollmentType: 'RENEWAL', status: { not: 'CANCELLED' } },
                    take: 1,
                  }),
                }),
              },
            },
          },
        },
        skip: 0,
        take: 25,
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('should apply status and gateStatus filters', async () => {
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);
    prismaMock.reEnrollmentInvite.count.mockResolvedValue(0);

    await findManyByPeriod(
      'period-1',
      { status: 'SENT', gateStatus: 'CONVITE_ENVIADO' },
      { page: 1, limit: 25 }
    );

    expect(prismaMock.reEnrollmentInvite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { periodId: 'period-1', status: 'SENT', gateStatus: 'CONVITE_ENVIADO' },
      })
    );
  });
});
