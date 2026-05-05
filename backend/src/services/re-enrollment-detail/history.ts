import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';

/**
 * Timeline of StudentHistory entries relevant to this invite. Scoping:
 *
 *   - Every RE_ENROLLMENT_* action where details.periodId matches the
 *     invite's period (gate transitions recorded by transitionGate).
 *   - Every other action on the same student whose createdAt falls
 *     inside the period window (period.openedAt or createdAt → closedAt
 *     or now), which captures ancillary events — status edits, doc
 *     reviews, etc. — that happen to coincide with the campaign.
 *
 * Actor (User) is included so the frontend can render 'who' for each
 * entry. Ordered desc so the timeline reads newest-first.
 */
export async function getInviteHistory(inviteId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    select: {
      studentId: true,
      periodId: true,
      period: {
        select: {
          openedAt: true,
          createdAt: true,
          closedAt: true,
          finalizedAt: true,
        },
      },
    },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  const windowStart = invite.period.openedAt ?? invite.period.createdAt;
  const windowEnd =
    invite.period.closedAt ?? invite.period.finalizedAt ?? new Date();

  const entries = await prisma.studentHistory.findMany({
    where: {
      studentId: invite.studentId,
      OR: [
        // Re-enrollment gate transitions scoped to this period —
        // always surfaced regardless of window bounds.
        {
          action: { startsWith: 'RE_ENROLLMENT_' },
          details: { path: ['periodId'], equals: invite.periodId },
        },
        // Everything else on the student, within the campaign window.
        {
          NOT: { action: { startsWith: 'RE_ENROLLMENT_' } },
          createdAt: { gte: windowStart, lte: windowEnd },
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      action: true,
      details: true,
      createdAt: true,
      actorId: true,
    },
  });

  const actorIds = [...new Set(entries.map((e) => e.actorId).filter((id): id is string => !!id))];
  const users = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, displayName: true, email: true, avatarUrl: true },
      })
    : [];
  const actorById = new Map(users.map((u) => [u.id, u]));

  return entries.map((e) => ({
    id: e.id,
    action: e.action,
    details: e.details,
    createdAt: e.createdAt,
    actor: e.actorId ? actorById.get(e.actorId) ?? null : null,
  }));
}

export type InviteHistoryEntry = Awaited<ReturnType<typeof getInviteHistory>>[number];
