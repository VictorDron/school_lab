import { nanoid } from 'nanoid';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { createAppError } from '../../lib/error-messages.js';
import { sendDocumentRejectionEmail } from '../email.service.js';
import { getOrCreateSettings } from '../settings.service.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';

/**
 * Document rejection recovery: mint a fresh invite token, reset rejected
 * documents to PENDING (so the family can re-upload), and email the new
 * link with the list of rejected docs. Capture the rejected docs BEFORE
 * the reset — the updateMany clears the reason and we want it in the email.
 */
export async function regenerateInviteLink(inviteId: string, _userId: string) {
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

  const newToken = nanoid();
  await prisma.reEnrollmentInvite.update({
    where: { id: inviteId },
    data: {
      token: newToken,
      status: 'SENT',
    },
  });

  const rejectedDocs = await prisma.leadEnrollmentDocument.findMany({
    where: {
      leadId: invite.student.leadId,
      status: 'REJECTED',
    },
    select: { documentType: true, fileName: true, rejectionReason: true },
  });

  await prisma.leadEnrollmentDocument.updateMany({
    where: {
      leadId: invite.student.leadId,
      status: 'REJECTED',
    },
    data: {
      status: 'PENDING',
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    },
  });

  const lead = invite.student.lead;
  const email = lead?.primaryContactEmail;

  if (email) {
    try {
      const { schoolName } = await getOrCreateSettings();
      await sendDocumentRejectionEmail({
        to: email,
        familyName: lead?.familyName ?? lead?.primaryContactName ?? '',
        studentName: invite.student.child?.fullName ?? invite.student.fullName,
        formLink: `${config.frontendUrl}/re-enrollment/${newToken}`,
        rejectedDocuments: rejectedDocs.map((d) => ({
          type: d.documentType,
          name: d.fileName,
        })),
        schoolName,
      });
    } catch (emailErr) {
      logger.warn('Failed to send document rejection email', {
        inviteId,
        error: (emailErr as Error).message,
      });
    }
  }

  try {
    getIO()
      .to(`re-enrollment:${invite.periodId}`)
      .emit('re-enrollment:invite:updated', { inviteId });
  } catch {
    // non-fatal
  }

  return { token: newToken, formLink: `${config.frontendUrl}/re-enrollment/${newToken}` };
}
