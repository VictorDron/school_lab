import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, emailMock, queueMock, settingsMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentPeriod: {
      findUnique: vi.fn(),
    },
    reEnrollmentInvite: {
      findMany: vi.fn(),
    },
  };
  const emailMock = {
    sendReEnrollmentInviteEmail: vi.fn(),
  };
  const queueMock = {
    reminderQueue: {
      add: vi.fn(),
      getRepeatableJobs: vi.fn(),
      removeRepeatableByKey: vi.fn(),
    },
  };
  const settingsMock = {
    getOrCreateSettings: vi.fn().mockResolvedValue({ schoolName: 'Test School' }),
  };
  return { prismaMock, emailMock, queueMock, settingsMock };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock('../services/email.service.js', () => emailMock);
vi.mock('../services/settings.service.js', () => settingsMock);
vi.mock('../queues/reminder.queue.js', () => queueMock);
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));

import { sendPendingReminders, scheduleReminders, removeReminders } from '../services/re-enrollment-communication.service.js';

const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
const farFutureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

const mockPeriod = {
  id: 'period-1',
  name: 'Rematrícula 2027',
  status: 'OPEN',
  endDate: futureDate,
};

function makeInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: `inv-${Math.random().toString(36).slice(2, 6)}`,
    periodId: 'period-1',
    status: 'SENT',
    token: `tok-${Math.random().toString(36).slice(2, 8)}`,
    optOutReminders: false,
    extendedDeadline: null,
    student: {
      id: 'stu-1',
      grade: '5th Grade',
      lead: { primaryContactEmail: 'test@test.com', familyName: 'Silva', primaryContactName: 'Ana' },
      child: { fullName: 'Maria Silva' },
    },
    period: mockPeriod,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Re-enrollment Reminder Service', () => {
  // REMAT-13: Reminder job logic
  it('should find pending invites within reminder window', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([
      makeInvite({ status: 'SENT' }),
      makeInvite({ status: 'OPENED' }),
    ]);
    emailMock.sendReEnrollmentInviteEmail.mockResolvedValue({ success: true });

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
    expect(prismaMock.reEnrollmentInvite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          periodId: 'period-1',
          status: { in: ['SENT', 'OPENED'] },
          optOutReminders: false,
        },
      })
    );
  });

  it('should skip invites with optOutReminders=true', async () => {
    // optOutReminders=true invites are filtered at DB level (where clause)
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]); // DB returns none because of optOutReminders=false filter

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(0);
    const whereClause = prismaMock.reEnrollmentInvite.findMany.mock.calls[0][0].where;
    expect(whereClause.optOutReminders).toBe(false);
  });

  it('should skip invites already CONFIRMED or DECLINED', async () => {
    // CONFIRMED/DECLINED are filtered at DB level (status IN SENT, OPENED)
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(0);
    const whereClause = prismaMock.reEnrollmentInvite.findMany.mock.calls[0][0].where;
    expect(whereClause.status).toEqual({ in: ['SENT', 'OPENED'] });
  });

  it('should send reminder email for each eligible invite', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    const inv1 = makeInvite();
    const inv2 = makeInvite();
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([inv1, inv2]);
    emailMock.sendReEnrollmentInviteEmail.mockResolvedValue({ success: true });

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(2);
    expect(emailMock.sendReEnrollmentInviteEmail).toHaveBeenCalledTimes(2);
  });

  it('should handle email failure gracefully', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue(mockPeriod);
    const inv1 = makeInvite();
    const inv2 = makeInvite();
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([inv1, inv2]);
    let callCount = 0;
    emailMock.sendReEnrollmentInviteEmail.mockImplementation(() => {
      callCount++;
      if (callCount === 2) return Promise.reject(new Error('Email service down'));
      return Promise.resolve({ success: true });
    });

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('should skip invites outside reminder window', async () => {
    prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({
      ...mockPeriod,
      endDate: farFutureDate, // 30 days out, beyond 7-day window
    });
    prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([
      makeInvite(),
    ]);

    const result = await sendPendingReminders('period-1');

    expect(result.sent).toBe(0);
    expect(result.skipped).toBeGreaterThan(0);
  });

  // REMAT-13: Queue scheduling
  it('should schedule repeatable job for period', async () => {
    queueMock.reminderQueue.add.mockResolvedValue({ id: 'job-1', name: 'check-reminders' });

    const result = await scheduleReminders('period-1', 3600000);

    expect(queueMock.reminderQueue.add).toHaveBeenCalledWith(
      'check-reminders',
      { periodId: 'period-1', type: 'send-reminders' },
      {
        repeat: { every: 3600000 },
        jobId: 'reminder-check-period-1',
      }
    );
    expect(result).toBeTruthy();
  });

  it('should remove repeatable job when period closes', async () => {
    queueMock.reminderQueue.getRepeatableJobs.mockResolvedValue([
      { id: 'reminder-check-period-1', key: 'check-reminders:reminder-check-period-1:::3600000' },
      { id: 'reminder-check-period-2', key: 'check-reminders:reminder-check-period-2:::3600000' },
    ]);

    await removeReminders('period-1');

    expect(queueMock.reminderQueue.removeRepeatableByKey).toHaveBeenCalledTimes(1);
    expect(queueMock.reminderQueue.removeRepeatableByKey).toHaveBeenCalledWith(
      'check-reminders:reminder-check-period-1:::3600000'
    );
  });
});
