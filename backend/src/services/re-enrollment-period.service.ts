import { prisma } from '../config/database.js';
import { createAppError } from '../lib/error-messages.js';
import { redis } from '../config/redis.js';
import { getIO } from '../socket/io.js';
import logger from '../utils/logger.js';

type ReEnrollmentPeriodStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'FINALIZED';

export interface CreatePeriodData {
  name: string;
  targetYear: number;
  startDate: Date;
  endDate: Date;
  eligibleGrades?: string[];
}

export interface UpdatePeriodData {
  name?: string;
  targetYear?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PeriodFilters {
  status?: ReEnrollmentPeriodStatus;
  targetYear?: number;
}

export interface PeriodPagination {
  page: number;
  limit: number;
}

const ALL_GRADES = [
  'Nursery', 'Pre-K3', 'Pre-K4', 'Kindergarten',
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade',
  '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
];

const validPeriodTransitions: Record<ReEnrollmentPeriodStatus, ReEnrollmentPeriodStatus[]> = {
  DRAFT: ['OPEN'],
  OPEN: ['CLOSED'],
  CLOSED: ['FINALIZED'],
  FINALIZED: [],
};

const periodTimestampField: Partial<Record<ReEnrollmentPeriodStatus, string>> = {
  OPEN: 'openedAt',
  CLOSED: 'closedAt',
  FINALIZED: 'finalizedAt',
};

export function canTransitionPeriod(
  from: ReEnrollmentPeriodStatus,
  to: ReEnrollmentPeriodStatus,
): boolean {
  return validPeriodTransitions[from]?.includes(to) ?? false;
}

/**
 * Single source of truth for the "only one OPEN period at a time" invariant.
 *
 * Throws PERIOD_ALREADY_OPEN (409) if any ReEnrollmentPeriod other than the
 * one identified by `excludeId` is currently in OPEN status. Every write path
 * that can produce status='OPEN' (transitions, seeds, ad-hoc admin scripts)
 * MUST pass through this guard before mutating the row.
 */
export async function assertNoOtherOpenPeriod(excludeId?: string): Promise<void> {
  const where: { status: 'OPEN'; id?: { not: string } } = { status: 'OPEN' };
  if (excludeId) {
    where.id = { not: excludeId };
  }

  const conflicting = await prisma.reEnrollmentPeriod.findFirst({
    where,
    select: { id: true, name: true },
  });

  if (conflicting) {
    throw createAppError('PERIOD_ALREADY_OPEN', {
      conflictingPeriodId: conflicting.id,
      conflictingPeriodName: conflicting.name,
    });
  }
}

export async function createPeriod(data: CreatePeriodData, userId: string) {
  const eligibleGrades = data.eligibleGrades?.length ? data.eligibleGrades : ALL_GRADES;

  return prisma.reEnrollmentPeriod.create({
    data: {
      ...data,
      eligibleGrades,
      status: 'DRAFT',
      createdById: userId,
    },
  });
}

export async function transitionPeriod(
  periodId: string,
  newStatus: ReEnrollmentPeriodStatus,
  _userId: string,
) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  const currentStatus = period.status as ReEnrollmentPeriodStatus;

  if (!canTransitionPeriod(currentStatus, newStatus)) {
    throw createAppError('INVALID_PERIOD_TRANSITION', `${currentStatus} -> ${newStatus}`);
  }

  if (newStatus === 'OPEN') {
    await assertNoOtherOpenPeriod(periodId);
  }

  const updateData: Record<string, unknown> = { status: newStatus };
  const tsField = periodTimestampField[newStatus];
  if (tsField) {
    updateData[tsField] = new Date();
  }

  const updated = await prisma.reEnrollmentPeriod.update({
    where: { id: periodId },
    data: updateData,
  });

  try {
    await redis.publish(
      're-enrollment:periods',
      JSON.stringify({ type: 'period:transitioned', periodId }),
    );
    getIO().to('re-enrollment').emit('re-enrollment:period:updated', { periodId });
  } catch (err) {
    logger.warn('Re-enrollment event publish failed', { periodId, error: (err as Error).message });
  }

  return updated;
}

export async function updatePeriod(
  periodId: string,
  data: UpdatePeriodData,
  _userId: string,
) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  if (period.status !== 'DRAFT') {
    throw createAppError('PERIOD_NOT_DRAFT');
  }

  if (data.startDate && data.endDate && data.endDate <= data.startDate) {
    throw createAppError('PERIOD_INVALID_DATES');
  }

  if (data.endDate && !data.startDate && data.endDate <= period.startDate) {
    throw createAppError('PERIOD_INVALID_DATES');
  }

  if (data.startDate && !data.endDate && period.endDate <= data.startDate) {
    throw createAppError('PERIOD_INVALID_DATES');
  }

  const updated = await prisma.reEnrollmentPeriod.update({
    where: { id: periodId },
    data,
  });

  try {
    await redis.publish(
      're-enrollment:periods',
      JSON.stringify({ type: 'period:updated', periodId }),
    );
    getIO().to('re-enrollment').emit('re-enrollment:period:updated', { periodId });
  } catch (err) {
    logger.warn('Re-enrollment event publish failed', { periodId, error: (err as Error).message });
  }

  return updated;
}

export async function deletePeriod(periodId: string, userId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    include: {
      _count: { select: { invites: true, preReEnrollmentResponses: true } },
    },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  if (period.status === 'OPEN') {
    throw createAppError('PERIOD_CANNOT_DELETE_OPEN');
  }

  await prisma.reEnrollmentPeriod.delete({ where: { id: periodId } });

  try {
    await redis.publish(
      're-enrollment:periods',
      JSON.stringify({ type: 'period:deleted', periodId }),
    );
    getIO().to('re-enrollment').emit('re-enrollment:period:deleted', { periodId });
  } catch (err) {
    logger.warn('Re-enrollment event publish failed', { periodId, error: (err as Error).message });
  }

  logger.info('Re-enrollment period deleted', {
    periodId,
    userId,
    name: period.name,
    status: period.status,
    inviteCount: period._count.invites,
  });
}

export async function findPeriodById(id: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id },
    include: { _count: { select: { invites: true } } },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  return period;
}

export async function findManyPeriods(
  filters: PeriodFilters,
  pagination: PeriodPagination,
) {
  const where: Record<string, unknown> = {};

  if (filters.status) where.status = filters.status;
  if (filters.targetYear) where.targetYear = filters.targetYear;

  const skip = (pagination.page - 1) * pagination.limit;

  const [periods, total] = await Promise.all([
    prisma.reEnrollmentPeriod.findMany({
      where,
      skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reEnrollmentPeriod.count({ where }),
  ]);

  return {
    periods,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

interface TimelineMilestone {
  type: string;
  date: Date | null;
  label: string;
}

export async function getPeriodTimeline(periodId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  const [firstSent, firstConfirmed, lastConfirmed] = await Promise.all([
    prisma.reEnrollmentInvite.findFirst({
      where: { periodId, sentAt: { not: null } },
      orderBy: { sentAt: 'asc' },
      select: { sentAt: true },
    }),
    prisma.reEnrollmentInvite.findFirst({
      where: { periodId, confirmedAt: { not: null } },
      orderBy: { confirmedAt: 'asc' },
      select: { confirmedAt: true },
    }),
    prisma.reEnrollmentInvite.findFirst({
      where: { periodId, confirmedAt: { not: null } },
      orderBy: { confirmedAt: 'desc' },
      select: { confirmedAt: true },
    }),
  ]);

  const milestones: TimelineMilestone[] = [];
  const periodAny = period as Record<string, unknown>;

  if (periodAny.openedAt) {
    milestones.push({
      type: 'period_opened',
      date: periodAny.openedAt as Date,
      label: 'Campanha aberta',
    });
  }

  if (firstSent?.sentAt) {
    milestones.push({
      type: 'first_invite_sent',
      date: firstSent.sentAt,
      label: 'Primeiro convite enviado',
    });
  }

  if (firstConfirmed?.confirmedAt) {
    milestones.push({
      type: 'first_confirmation',
      date: firstConfirmed.confirmedAt,
      label: 'Primeira confirmação',
    });
  }

  if (
    lastConfirmed?.confirmedAt &&
    firstConfirmed?.confirmedAt &&
    lastConfirmed.confirmedAt.getTime() !== firstConfirmed.confirmedAt.getTime()
  ) {
    milestones.push({
      type: 'last_confirmation',
      date: lastConfirmed.confirmedAt,
      label: 'Última confirmação',
    });
  }

  if (periodAny.closedAt) {
    milestones.push({
      type: 'period_closed',
      date: periodAny.closedAt as Date,
      label: 'Campanha encerrada',
    });
  }

  if (periodAny.finalizedAt) {
    milestones.push({
      type: 'period_finalized',
      date: periodAny.finalizedAt as Date,
      label: 'Campanha finalizada',
    });
  }

  return { milestones };
}
