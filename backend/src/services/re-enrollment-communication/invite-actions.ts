import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { createAppError } from '../../lib/error-messages.js';
import { sendReEnrollmentInviteEmail } from '../email.service.js';
import { updateInviteStatus } from '../re-enrollment-invite.service.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';

/**
 * Re-deliver an invite. Resets status to SENT (so the OPENED/CLICKED
 * timeline restarts), re-sends the email, and broadcasts the dashboard
 * update. Email failure is non-fatal — the status flip is the audit.
 */
export async function resendInvite(inviteId: string, _userId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    include: {
      student: { include: { lead: true, child: true } },
      period: true,
    },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  if (invite.status === 'CONFIRMED') {
    throw createAppError('INVITE_ALREADY_CONFIRMED');
  }

  await updateInviteStatus(inviteId, 'SENT');

  try {
    const lead = invite.student.lead;
    const child = invite.student.child;

    if (lead?.primaryContactEmail) {
      await sendReEnrollmentInviteEmail({
        to: lead.primaryContactEmail,
        familyName: lead.familyName ?? lead.primaryContactName ?? '',
        studentName: child?.fullName ?? '',
        formLink: `${config.frontendUrl}/re-enrollment/${invite.token}`,
        suggestedGrade: invite.student.grade,
        deadline: (invite as Record<string, unknown>).extendedDeadline as Date ?? invite.period.endDate,
      });
    }
  } catch (err) {
    logger.warn('Failed to send re-enrollment invite email on resend:', err);
  }

  try {
    getIO()
      .to(`re-enrollment:${invite.periodId}`)
      .emit('re-enrollment:invite:updated', { inviteId });
  } catch {
    // non-fatal
  }

  return { success: true };
}

/**
 * Soft-cancel by flipping the invite to EXPIRED. Refuses to cancel an
 * invite that already reached a terminal state (CONFIRMED/DECLINED) so the
 * audit trail stays meaningful.
 */
export async function cancelInvite(inviteId: string, _userId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  if (invite.status === 'CONFIRMED' || invite.status === 'DECLINED') {
    throw createAppError('INVITE_CANNOT_CANCEL');
  }

  await updateInviteStatus(inviteId, 'EXPIRED');

  try {
    getIO()
      .to(`re-enrollment:${invite.periodId}`)
      .emit('re-enrollment:invite:updated', { inviteId });
  } catch {
    // non-fatal
  }

  return { success: true };
}

export async function extendInviteDeadline(inviteId: string, newDeadline: Date, _userId: string) {
  if (newDeadline <= new Date()) {
    throw createAppError('INVITE_DEADLINE_PAST');
  }

  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  const updated = await prisma.reEnrollmentInvite.update({
    where: { id: inviteId },
    data: { extendedDeadline: newDeadline },
  });

  try {
    getIO()
      .to(`re-enrollment:${invite.periodId}`)
      .emit('re-enrollment:invite:updated', { inviteId });
  } catch {
    // non-fatal
  }

  return updated;
}
