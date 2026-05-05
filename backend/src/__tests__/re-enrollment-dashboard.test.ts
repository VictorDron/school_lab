import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, inviteServiceMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      groupBy: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    reEnrollmentPeriod: {
      findUnique: vi.fn(),
    },
  };
  const inviteServiceMock = {
    createInvite: vi.fn(),
    findByToken: vi.fn(),
    updateStatus: vi.fn(),
    findManyByPeriod: vi.fn(),
  };
  return { prismaMock, inviteServiceMock };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock(import('../services/re-enrollment-invite.service.js'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateInviteStatus: inviteServiceMock.updateStatus,
  };
});
vi.mock('../services/email.service.js', () => ({
  sendReEnrollmentInviteEmail: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

import {
  getPeriodDashboardStats,
  generatePeriodReport,
} from '../services/re-enrollment-analytics.service.js';
import { getPeriodTimeline } from '../services/re-enrollment-period.service.js';
import {
  resendInvite,
  cancelInvite,
  extendInviteDeadline,
} from '../services/re-enrollment-communication.service.js';
import { generateCSV } from '../lib/csv-export.js';

const mockPeriod = {
  id: 'period-1',
  name: 'Rematrícula 2027',
  status: 'OPEN',
  startDate: new Date('2027-01-01'),
  endDate: new Date('2027-02-01'),
  openedAt: new Date('2027-01-01'),
  closedAt: null,
  finalizedAt: null,
  _count: { invites: 15 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Re-enrollment Dashboard Service', () => {
  // REMAT-12: Dashboard stats
  it('should return correct invite status counts for a period', async () => {
    prismaMock.reEnrollmentInvite.groupBy
      .mockResolvedValueOnce([
        { status: 'CONFIRMED', _count: { _all: 5 } },
        { status: 'SENT', _count: { _all: 7 } },
        { status: 'EXPIRED', _count: { _all: 3 } },
      ])
      .mockResolvedValueOnce([
        { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 10 } },
        { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 5 } },
      ]);
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);

    const result = await getPeriodDashboardStats('period-1');

    expect(result.statusCounts).toHaveLength(3);
    expect(result.gateStatusCounts).toHaveLength(2);
    expect(result.total).toBe(15);
    expect(result.period).toBeTruthy();
    expect(prismaMock.reEnrollmentInvite.groupBy).toHaveBeenCalledTimes(2);
  });

  it('should filter stats by grade', async () => {
    prismaMock.reEnrollmentInvite.groupBy
      .mockResolvedValueOnce([{ status: 'SENT', _count: { _all: 3 } }])
      .mockResolvedValueOnce([{ gateStatus: 'CONVITE_ENVIADO', _count: { _all: 3 } }]);
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({ ...mockPeriod, _count: { invites: 3 } });

    const result = await getPeriodDashboardStats('period-1', { grade: '5th Grade' });

    expect(result.total).toBe(3);
    const groupByCall = prismaMock.reEnrollmentInvite.groupBy.mock.calls[0][0];
    expect(groupByCall.where.student).toEqual({ grade: '5th Grade' });
  });

  it('should return timeline milestones with correct timestamps', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findFirst
      .mockResolvedValueOnce({ sentAt: new Date('2027-01-02') })
      .mockResolvedValueOnce({ confirmedAt: new Date('2027-01-05') })
      .mockResolvedValueOnce({ confirmedAt: new Date('2027-01-20') });

    const result = await getPeriodTimeline('period-1');

    expect(result.milestones.length).toBeGreaterThanOrEqual(3);
    expect(result.milestones[0].type).toBe('period_opened');
    expect(result.milestones[0].label).toBe('Campanha aberta');
    expect(result.milestones.find((m: { type: string }) => m.type === 'first_invite_sent')).toBeTruthy();
    expect(result.milestones.find((m: { type: string }) => m.type === 'first_confirmation')).toBeTruthy();
  });

  // REMAT-12: Invite management actions
  it('should resend invite and reset status to SENT', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'SENT',
      periodId: 'period-1',
      token: 'tok-123',
      student: {
        id: 'stu-1',
        grade: '5th Grade',
        lead: { primaryContactEmail: 'test@test.com', familyName: 'Silva' },
        child: { fullName: 'Maria Silva' },
      },
      period: { endDate: new Date('2027-02-01') },
    });
    inviteServiceMock.updateStatus.mockResolvedValue({ id: 'inv-1', status: 'SENT' });

    const result = await resendInvite('inv-1', 'user-1');

    expect(result.success).toBe(true);
    expect(inviteServiceMock.updateStatus).toHaveBeenCalledWith('inv-1', 'SENT');
  });

  it('should reject resend on already CONFIRMED invite', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'CONFIRMED',
      periodId: 'period-1',
      student: { lead: {}, child: {} },
      period: {},
    });

    await expect(resendInvite('inv-1', 'user-1')).rejects.toThrow('confirmado');
  });

  it('should cancel invite and set status to EXPIRED', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'SENT',
      periodId: 'period-1',
    });
    inviteServiceMock.updateStatus.mockResolvedValue({ id: 'inv-1', status: 'EXPIRED' });

    const result = await cancelInvite('inv-1', 'user-1');

    expect(result.success).toBe(true);
    expect(inviteServiceMock.updateStatus).toHaveBeenCalledWith('inv-1', 'EXPIRED');
  });

  it('should reject cancel on CONFIRMED invite', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'CONFIRMED',
      periodId: 'period-1',
    });

    await expect(cancelInvite('inv-1', 'user-1')).rejects.toThrow();
  });

  it('should extend invite deadline with validation', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      status: 'SENT',
      periodId: 'period-1',
    });
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      id: 'inv-1',
      extendedDeadline: futureDate,
    });

    const result = await extendInviteDeadline('inv-1', futureDate, 'user-1');

    expect(result.extendedDeadline).toEqual(futureDate);
    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { extendedDeadline: futureDate },
    });
  });

  it('should reject extend with past deadline', async () => {
    const pastDate = new Date('2020-01-01');

    await expect(extendInviteDeadline('inv-1', pastDate, 'user-1')).rejects.toThrow('futuro');
  });

  // REMAT-14: Period closure report
  it('should generate period closure report with all categories', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([
      { id: '1', status: 'CONFIRMED', student: { child: {}, lead: {} } },
      { id: '2', status: 'CONFIRMED', student: { child: {}, lead: {} } },
      { id: '3', status: 'DECLINED', student: { child: {}, lead: {} } },
      { id: '4', status: 'EXPIRED', student: { child: {}, lead: {} } },
      { id: '5', status: 'SENT', student: { child: {}, lead: {} } },
      { id: '6', status: 'OPENED', student: { child: {}, lead: {} } },
      { id: '7', status: 'PENDING', student: { child: {}, lead: {} } },
    ]);

    const result = await generatePeriodReport('period-1');

    expect(result.summary.confirmed).toBe(2);
    expect(result.summary.declined).toBe(1);
    expect(result.summary.expired).toBe(1);
    expect(result.summary.nonResponded).toBe(3);
    expect(result.summary.total).toBe(7);
    expect(result.confirmed).toHaveLength(2);
    expect(result.nonResponded).toHaveLength(3);
  });

  it('should generate valid CSV with proper escaping', () => {
    const rows = [
      { Nome: 'Maria Silva', Turma: '5th Grade', Status: 'Confirmado' },
      { Nome: 'João "Jr" Santos', Turma: '3rd Grade', Status: 'Pendente' },
    ];

    const csv = generateCSV(rows, ['Nome', 'Turma', 'Status']);

    expect(csv).toContain('Nome,Turma,Status');
    expect(csv).toContain('"Maria Silva"');
    expect(csv).toContain('"João ""Jr"" Santos"');
  });

  it('should sanitize CSV formula injection characters', () => {
    const rows = [
      { Nome: '=CMD()', Valor: '+1234', Obs: '-test' },
      { Nome: '@email', Valor: 'normal', Obs: 'ok' },
    ];

    const csv = generateCSV(rows, ['Nome', 'Valor', 'Obs']);

    expect(csv).not.toMatch(/"=CMD\(\)"/);
    expect(csv).toContain('"\t=CMD()"');
    expect(csv).toContain('"\t+1234"');
    expect(csv).toContain('"\t-test"');
    expect(csv).toContain('"\t@email"');
    expect(csv).toContain('"normal"');
  });
});
