import { prisma } from '../../config/database.js';
import { AdmissionGateStatus } from '@prisma/client';
import logger from '../../utils/logger.js';
import { getNotificationRecipients } from '../../utils/notification-contacts.js';
import { gateToColumnSlug } from './state-machine.js';
import { dispatchEnrolledWelcomeAndStudents } from './notifications.js';

/**
 * Bypasses the public `transition` orchestrator: writes the lead status
 * + LeadHistory directly. Used by auto-advance handlers that have already
 * cleared the original transition's checks and need to silently bump the
 * lead to a follow-up state.
 */
async function applyAutoAdvance(
  leadId: string,
  userId: string,
  fromStatus: AdmissionGateStatus,
  toStatus: AdmissionGateStatus,
  notes: string,
): Promise<void> {
  const targetSlug = gateToColumnSlug[toStatus];
  let colId: string | undefined;
  if (targetSlug) {
    // findFirst (not findUnique) so the auto-scope middleware injects
    // tenantId into the where — slug is now per-tenant unique.
    const col = await prisma.kanbanColumn.findFirst({ where: { slug: targetSlug } });
    if (col) colId = col.id;
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        admissionGateStatus: toStatus,
        ...(colId ? { columnId: colId } : {}),
      },
    }),
    prisma.leadHistory.create({
      data: {
        leadId,
        action: 'ADMISSION_GATE_CHANGED',
        actorId: userId,
        details: {
          previousStatus: fromStatus,
          newStatus: toStatus,
          notes,
        },
      },
    }),
  ]);
}

/**
 * After APPROVED, auto-advance the lead to ENROLLMENT_PENDING and trigger
 * the enrollment link generation + family email.
 */
async function autoAdvanceFromApproved(leadId: string, userId: string): Promise<void> {
  try {
    await applyAutoAdvance(leadId, userId, 'APPROVED', 'ENROLLMENT_PENDING', 'Auto-advanced after approval');

    try {
      const EnrollmentService = await import('../enrollment.service.js');
      const result = await EnrollmentService.generateEnrollmentLink(leadId, userId);

      const recipients = await getNotificationRecipients(leadId);
      if (recipients.length > 0) {
        const leadInfo = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { familyName: true },
        });
        const { sendEnrollmentLinkEmail } = await import('../email.service.js');
        await sendEnrollmentLinkEmail({
          to: recipients.map((r) => r.email),
          contactName: recipients[0].name,
          familyName: leadInfo?.familyName || '',
          link: result.enrollmentLink,
          expiresInHours: result.expiryHours,
        });
      }
    } catch (err) {
      logger.warn('Failed to auto-generate enrollment link', { leadId, error: (err as Error).message });
    }
  } catch (err) {
    logger.warn('Auto-advance failed', { leadId, from: 'APPROVED', error: (err as Error).message });
  }
}

/**
 * After FINANCIAL_APPROVED, auto-advance the lead to ENROLLED and run the
 * welcome email + Student record creation.
 */
async function autoAdvanceFromFinancialApproved(leadId: string, userId: string): Promise<void> {
  try {
    await applyAutoAdvance(
      leadId,
      userId,
      'FINANCIAL_APPROVED',
      'ENROLLED',
      'Auto-enrolled after financial approval',
    );

    await dispatchEnrolledWelcomeAndStudents(leadId, userId);
  } catch (err) {
    logger.warn('Auto-advance failed', { leadId, from: 'FINANCIAL_APPROVED', error: (err as Error).message });
  }
}

/**
 * Dispatches gate-driven auto-advance after a successful primary transition.
 * Currently bumps APPROVED → ENROLLMENT_PENDING and FINANCIAL_APPROVED →
 * ENROLLED. No-op for any other newStatus.
 */
export async function runAutoAdvance(
  newStatus: AdmissionGateStatus,
  leadId: string,
  userId: string,
): Promise<void> {
  if (newStatus === 'APPROVED') {
    await autoAdvanceFromApproved(leadId, userId);
    return;
  }

  if (newStatus === 'FINANCIAL_APPROVED') {
    await autoAdvanceFromFinancialApproved(leadId, userId);
  }
}
