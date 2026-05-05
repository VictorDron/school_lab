import { prisma } from '../config/database.js';
import { createAppError } from '../lib/error-messages.js';
import { sendReEnrollmentInviteEmail } from './email.service.js';
import { getNextGrade } from './grade-progression.js';
import { createAuditLog } from './audit.service.js';
import { config } from '../config/index.js';
import {
  createInvite,
  updateInviteStatus,
  updateInviteEmailStatus,
  type InviteFilters,
  type InvitePagination,
} from './re-enrollment-invite.service.js';
import logger from '../utils/logger.js';

const BATCH_SIZE = 5;

export async function findEligibleStudents(periodId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw createAppError('PERIOD_NOT_FOUND');
  if (period.status !== 'OPEN') throw createAppError('BATCH_PERIOD_NOT_OPEN');

  const alreadyPromoted = await prisma.student.findMany({
    where: { academicYear: period.targetYear },
    select: { leadChildId: true },
  });
  const promotedChildIds = new Set(alreadyPromoted.map((s) => s.leadChildId));

  const eligible = await prisma.student.findMany({
    where: {
      status: 'ACTIVE',
      academicYear: period.targetYear - 1,
      grade: { in: period.eligibleGrades },
    },
    include: {
      lead: {
        select: { id: true, primaryContactEmail: true, familyName: true },
      },
      child: { select: { id: true, fullName: true } },
    },
  });

  const existingInvites = await prisma.reEnrollmentInvite.findMany({
    where: { periodId },
    select: { studentId: true },
  });
  const invitedIds = new Set(existingInvites.map((i) => i.studentId));

  return {
    eligible: eligible.filter(
      (s) => !invitedIds.has(s.id) && !promotedChildIds.has(s.leadChildId),
    ),
    alreadyInvited: invitedIds.size,
    alreadyPromoted: promotedChildIds.size,
    period,
  };
}

/**
 * Unified view: all eligible students merged with their invite data (if any).
 * Students without an invite appear with invite: null.
 */
export async function findUnifiedManagement(
  periodId: string,
  filters: InviteFilters & { unified?: string } = {},
  pagination: InvitePagination = { page: 1, limit: 100 },
) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw createAppError('PERIOD_NOT_FOUND');

  const alreadyPromoted = await prisma.student.findMany({
    where: { academicYear: period.targetYear },
    select: { leadChildId: true },
  });
  const promotedChildIds = new Set(alreadyPromoted.map((s) => s.leadChildId));

  const allStudents = await prisma.student.findMany({
    where: {
      status: 'ACTIVE',
      academicYear: period.targetYear - 1,
      grade: { in: period.eligibleGrades },
    },
    include: {
      lead: {
        select: {
          id: true,
          primaryContactEmail: true,
          familyName: true,
          contracts: {
            where: { enrollmentType: 'RENEWAL', status: { not: 'CANCELLED' } },
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            select: {
              id: true,
              code: true,
              status: true,
              clicksignStatus: true,
              sentAt: true,
              signedAt: true,
              documentUrl: true,
              signedDocumentUrl: true,
              signers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  hasSigned: true,
                  signedAt: true,
                },
              },
            },
          },
        },
      },
      child: { select: { id: true, fullName: true } },
    },
  });

  const invites = await prisma.reEnrollmentInvite.findMany({
    where: { periodId },
    select: {
      id: true,
      token: true,
      status: true,
      gateStatus: true,
      notes: true,
      createdAt: true,
      sentAt: true,
      openedAt: true,
      confirmedAt: true,
      extendedDeadline: true,
      studentId: true,
    },
  });
  const inviteByStudentId = new Map(invites.map((inv) => [inv.studentId, inv]));

  let rows = allStudents
    .filter((s) => !promotedChildIds.has(s.leadChildId))
    .map((student) => {
      const invite = inviteByStudentId.get(student.id) ?? null;
      return {
        student: {
          id: student.id,
          fullName: student.fullName,
          grade: student.grade,
          code: student.code,
          leadId: student.leadId,
          leadEmail: student.lead?.primaryContactEmail ?? null,
          childName: student.child?.fullName ?? null,
          lead: student.lead
            ? { id: student.lead.id, contracts: student.lead.contracts }
            : null,
        },
        invite,
      };
    });

  if (filters.unified === 'AWAITING') {
    rows = rows.filter((r) => !r.invite);
  } else if (filters.unified === 'INVITED') {
    rows = rows.filter((r) => !!r.invite);
  }

  if (filters.status) {
    rows = rows.filter((r) => r.invite?.status === filters.status);
  }

  if (filters.gateStatus) {
    rows = rows.filter((r) => r.invite?.gateStatus === filters.gateStatus);
  }

  if (filters.grade) {
    rows = rows.filter((r) => r.student.grade === filters.grade);
  }

  const total = rows.length;

  rows.sort((a, b) => {
    if (!a.invite && b.invite) return -1;
    if (a.invite && !b.invite) return 1;
    if (a.invite && b.invite) {
      return (
        new Date(b.invite.createdAt).getTime() -
        new Date(a.invite.createdAt).getTime()
      );
    }
    return (a.student.fullName ?? '').localeCompare(b.student.fullName ?? '');
  });

  const skip = (pagination.page - 1) * pagination.limit;
  const paged = rows.slice(skip, skip + pagination.limit);

  const awaiting = allStudents.length - invites.length;

  return {
    data: paged,
    total,
    page: pagination.page,
    limit: pagination.limit,
    meta: {
      totalStudents: allStudents.length,
      totalInvited: invites.length,
      awaiting: awaiting > 0 ? awaiting : 0,
    },
  };
}

export async function createBatchInvites(periodId: string, userId: string) {
  const { eligible, alreadyInvited, period } = await findEligibleStudents(periodId);

  if (eligible.length === 0) {
    return { created: 0, failed: 0, alreadyInvited, total: alreadyInvited };
  }

  let created = 0;
  let failed = 0;

  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (student) => {
        try {
          const invite = await createInvite(periodId, student.id);
          await updateInviteStatus(invite.id, 'SENT');

          const suggestedGrade = getNextGrade(student.grade ?? '');
          const formLink = `${config.frontendUrl}/re-enrollment/${invite.token}`;

          try {
            await sendReEnrollmentInviteEmail({
              to: student.lead.primaryContactEmail || '',
              familyName: student.lead.familyName || student.child.fullName,
              studentName: student.child.fullName,
              formLink,
              suggestedGrade,
              deadline: period.endDate,
            });
            await updateInviteEmailStatus(invite.id, 'SENT');
          } catch (emailErr) {
            await updateInviteEmailStatus(
              invite.id,
              'FAILED',
              (emailErr as Error).message,
            ).catch(() => {});
            logger.warn('Re-enrollment invite email failed', {
              studentId: student.id,
              error: (emailErr as Error).message,
            });
            failed++;
            return;
          }

          created++;
        } catch (err) {
          logger.warn('Re-enrollment invite creation failed', {
            studentId: student.id,
            error: (err as Error).message,
          });
          failed++;
        }
      }),
    );
  }

  try {
    await createAuditLog({
      actorId: userId,
      actorEmail: 'system',
      action: 'RE_ENROLLMENT_INVITE_SENT' as any,
      entityType: 'RE_ENROLLMENT_PERIOD',
      entityId: periodId,
      metadata: {
        created,
        failed,
        alreadyInvited,
        total: eligible.length + alreadyInvited,
      },
    });
  } catch (auditErr) {
    logger.warn('Audit log for batch invite failed', auditErr);
  }

  return {
    created,
    failed,
    alreadyInvited,
    total: eligible.length + alreadyInvited,
  };
}
