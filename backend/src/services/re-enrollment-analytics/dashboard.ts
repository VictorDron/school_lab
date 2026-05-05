import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import { NON_RESPONDED_STATUSES } from './shared.js';
import type { DashboardFilters, ReportInvite } from './types.js';

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Top-of-page dashboard for a re-enrollment period: invite-status and
 * gate-status distributions plus the early-bird countdown. Filters
 * apply only to the groupBys; the period header (and its `_count`) is
 * always returned for the unfiltered total.
 */
export async function getPeriodDashboardStats(
  periodId: string,
  filters?: DashboardFilters,
) {
  const where: Record<string, unknown> = { periodId };

  if (filters?.grade) {
    where.student = { grade: filters.grade };
  }

  const [statusCounts, gateStatusCounts, period] = await Promise.all([
    prisma.reEnrollmentInvite.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    }),
    prisma.reEnrollmentInvite.groupBy({
      by: ['gateStatus'],
      where,
      _count: { _all: true },
    }),
    prisma.reEnrollmentPeriod.findUnique({
      where: { id: periodId },
      include: { _count: { select: { invites: true } } },
    }),
  ]);

  const total = period?._count.invites ?? 0;
  const now = new Date();
  const earlyBirdDeadline = period?.earlyBirdDeadline ?? null;
  const earlyBirdExpired = earlyBirdDeadline
    ? new Date(earlyBirdDeadline) < now
    : false;
  const earlyBirdDaysLeft = earlyBirdDeadline
    ? Math.max(
        0,
        Math.ceil((new Date(earlyBirdDeadline).getTime() - now.getTime()) / DAY_MS),
      )
    : null;

  return {
    statusCounts,
    gateStatusCounts,
    total,
    period,
    earlyBirdExpired,
    earlyBirdDaysLeft,
  };
}

/**
 * Family-by-family report buckets. PENDING/SENT/OPENED collapse into
 * "non-responded" because the export consumer treats them all as "still
 * waiting on the family"; CONFIRMED/DECLINED/EXPIRED each get their
 * own bucket. Anything else falls through silently — schema additions
 * should explicitly opt into a bucket.
 */
export async function generatePeriodReport(periodId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND_FOR_REPORT');
  }

  const invites = await prisma.reEnrollmentInvite.findMany({
    where: { periodId },
    include: {
      student: {
        include: { child: true, lead: true },
      },
    },
  });

  const confirmed: ReportInvite[] = [];
  const declined: ReportInvite[] = [];
  const expired: ReportInvite[] = [];
  const nonResponded: ReportInvite[] = [];

  for (const inv of invites) {
    const item = inv as unknown as ReportInvite;
    switch (inv.status) {
      case 'CONFIRMED':
        confirmed.push(item);
        break;
      case 'DECLINED':
        declined.push(item);
        break;
      case 'EXPIRED':
        expired.push(item);
        break;
      default:
        if (NON_RESPONDED_STATUSES.includes(inv.status)) {
          nonResponded.push(item);
        }
        break;
    }
  }

  return {
    confirmed,
    declined,
    expired,
    nonResponded,
    summary: {
      confirmed: confirmed.length,
      declined: declined.length,
      expired: expired.length,
      nonResponded: nonResponded.length,
      total: invites.length,
    },
  };
}
