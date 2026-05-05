import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import { findInviteByToken, updateInviteStatus } from '../re-enrollment-invite.service.js';
import { transitionGate } from '../re-enrollment-gate.service.js';
import { createAuditLog } from '../audit.service.js';
import logger from '../../utils/logger.js';
import type { RequestMetadata, SubmitFormData } from './types.js';
import { applySectionUpdates } from './section-updates.js';

export async function submitForm(token: string, data: SubmitFormData, metadata?: RequestMetadata) {
  if (!data.lgpdConsent) {
    throw createAppError('FORM_LGPD_REQUIRED');
  }

  const invite = await findInviteByToken(token);

  if (invite.period.status !== 'OPEN') {
    throw createAppError('FORM_PERIOD_CLOSED');
  }

  if (invite.status === 'CONFIRMED') {
    throw createAppError('FORM_ALREADY_CONFIRMED');
  }

  if (invite.status === 'DECLINED') {
    throw createAppError('FORM_ALREADY_DECLINED');
  }

  // Handle decline — family does not want to re-enroll
  if (data.confirmed === false) {
    await updateInviteStatus(invite.id, 'DECLINED');

    try {
      await transitionGate(invite.id, 'RECUSADO');
    } catch (gateErr) {
      logger.warn('Gate transition to RECUSADO failed', { inviteId: invite.id, error: (gateErr as Error).message });
    }

    try {
      await createAuditLog({
        actorEmail: 'family@re-enrollment',
        action: 'RE_ENROLLMENT_DECLINED' as any,
        entityType: 'LEAD',
        entityId: invite.student.leadId,
        metadata: { inviteId: invite.id, reason: data.declineReason || null },
      });
    } catch (auditErr) {
      logger.warn('Audit log for decline failed', auditErr);
    }

    return { success: true, inviteId: invite.id, status: 'DECLINED' };
  }

  const leadId = invite.student.leadId;
  const childId = invite.student.leadChildId;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { primaryContactEmail: true },
  });
  const actorEmail = lead?.primaryContactEmail || 'family@re-enrollment';

  const changes = await applySectionUpdates(data, leadId, childId);

  if (data.correctionNotes) {
    await prisma.reEnrollmentInvite.update({
      where: { id: invite.id },
      data: { notes: data.correctionNotes },
    });
  }

  try {
    await prisma.parentalConsent.create({
      data: {
        leadId,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
        consentTextVersion: 'RE_ENROLLMENT_V1',
      },
    });
  } catch (consentErr) {
    logger.warn('LGPD consent record creation failed', consentErr);
  }

  await updateInviteStatus(invite.id, 'CONFIRMED');

  // STORY-002: Mark linked PreReEnrollmentResponse as AGREED on form submission
  try {
    await prisma.preReEnrollmentResponse.updateMany({
      where: {
        periodId: invite.periodId,
        studentId: invite.studentId,
        status: 'PENDING',
      },
      data: {
        status: 'AGREED',
        respondedAt: new Date(),
      },
    });
  } catch (preResponseErr) {
    logger.warn('Failed to mark PreReEnrollmentResponse as AGREED', {
      inviteId: invite.id,
      error: (preResponseErr as Error).message,
    });
  }

  await transitionGate(invite.id, 'FORMULARIO_CONFIRMADO');

  // Notify SECRETARIAT about pending doc/cadastro approval (non-fatal)
  try {
    const secretariatUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SECRETARY'] }, status: 'ACTIVE' },
      select: { id: true },
    });
    if (secretariatUsers.length > 0) {
      const { createBulkNotifications } = await import('../notification.service.js');
      await createBulkNotifications(
        secretariatUsers.map((u) => u.id),
        {
          type: 'reenrollment_docs_pending',
          title: 'Documentos de Rematrícula Pendentes',
          message: `${invite.student.fullName} enviou o formulário de rematrícula. Documentos e cadastro aguardam aprovação.`,
          data: { inviteId: invite.id, studentId: invite.student.id },
        },
      );
    }
  } catch (notifErr) {
    logger.warn('Failed to notify secretariat about re-enrollment form', {
      inviteId: invite.id,
      error: (notifErr as Error).message,
    });
  }

  // Send form confirmation email (non-fatal) — REMAT-11
  try {
    const { sendReEnrollmentFormConfirmationEmail } = await import('../email.service.js');
    const contactEmail = lead?.primaryContactEmail;
    if (contactEmail) {
      await sendReEnrollmentFormConfirmationEmail({
        to: contactEmail,
        familyName: invite.student.fullName,
        studentName: invite.student.fullName,
      });
    }
  } catch (emailErr) {
    logger.warn('Re-enrollment form confirmation email failed', { inviteId: invite.id, error: (emailErr as Error).message });
  }

  try {
    await createAuditLog({
      actorEmail,
      action: 'RE_ENROLLMENT_FORM_SUBMITTED' as any,
      entityType: 'LEAD',
      entityId: leadId,
      metadata: { inviteId: invite.id, source: 'RE_ENROLLMENT_FORM', changes },
    });
  } catch (auditErr) {
    logger.warn('Audit log for form submission failed', auditErr);
  }

  return { success: true, inviteId: invite.id };
}
