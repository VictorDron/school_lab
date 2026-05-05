import { prisma } from '../../config/database.js';
import { AdmissionGateStatus } from '@prisma/client';
import logger from '../../utils/logger.js';
import * as ApprovalTaskService from '../approval-task.service.js';
import { getNotificationRecipients } from '../../utils/notification-contacts.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';

/**
 * Publish CRM list refresh + per-lead room update.
 */
export async function publishGateEvents(leadId: string): Promise<void> {
  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'gate:transitioned', leadId }));
    getIO().to(`lead:${leadId}`).emit('crm:lead:updated', { leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }
}

/**
 * Send welcome email and auto-create Student records once the lead reaches
 * ENROLLED. Reused by both the direct ENROLLED transition and the
 * FINANCIAL_APPROVED → ENROLLED auto-advance.
 */
export async function dispatchEnrolledWelcomeAndStudents(
  leadId: string,
  userId: string,
): Promise<void> {
  try {
    const recipients = await getNotificationRecipients(leadId);
    if (recipients.length > 0) {
      const leadData = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { familyName: true, children: { select: { fullName: true } } },
      });
      const { sendEnrollmentWelcomeEmail } = await import('../email.service.js');
      const studentNames = leadData?.children.map((c) => c.fullName).join(', ') || leadData?.familyName || '';
      await sendEnrollmentWelcomeEmail({
        to: recipients.map((r) => r.email),
        parentName: recipients[0].name,
        familyName: leadData?.familyName || '',
        studentNames,
      });
    }
  } catch (emailErr) {
    logger.warn('Failed to send welcome email', { leadId, error: (emailErr as Error).message });
  }

  try {
    const { createStudentsFromEnrollment } = await import('../students/index.js');
    await createStudentsFromEnrollment(leadId, userId);
  } catch (studentErr) {
    logger.warn('Failed to auto-create student records', {
      leadId,
      error: (studentErr as Error).message,
    });
  }
}

/**
 * Send the family-facing email for the new gate status (FORM_APPROVED or
 * REJECTED). Cancels pending approval tasks on rejection.
 */
async function dispatchGateEmail(
  newStatus: AdmissionGateStatus,
  leadId: string,
  notes?: string,
): Promise<void> {
  if (newStatus === 'FORM_APPROVED') {
    try {
      const recipients = await getNotificationRecipients(leadId);
      if (recipients.length > 0) {
        const leadData = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { familyName: true },
        });
        const { sendFormApprovedEmail } = await import('../email.service.js');
        await sendFormApprovedEmail({
          to: recipients.map((r) => r.email),
          contactName: recipients[0].name,
          familyName: leadData?.familyName || '',
        });
      }
    } catch (err) {
      logger.warn('Failed to send form approved email', { leadId, error: (err as Error).message });
    }
    return;
  }

  if (newStatus === 'REJECTED') {
    try {
      const recipients = await getNotificationRecipients(leadId);
      if (recipients.length > 0) {
        const leadData = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { familyName: true },
        });
        const { sendRejectionEmail } = await import('../email.service.js');
        await sendRejectionEmail({
          to: recipients.map((r) => r.email),
          contactName: recipients[0].name,
          familyName: leadData?.familyName || '',
          reason: notes,
        });
      }
    } catch (err) {
      logger.warn('Failed to send rejection email', { leadId, error: (err as Error).message });
    }

    try {
      await ApprovalTaskService.cancelApprovalTasks(leadId);
    } catch (err) {
      logger.warn('Failed to cancel approval tasks on rejection', { leadId, error: (err as Error).message });
    }
  }
}

/**
 * When entering a state that precedes an approval-gated step, create
 * approval records so departments can see and act on them.
 */
async function createProactiveApprovals(
  newStatus: AdmissionGateStatus,
  leadId: string,
  userId: string,
): Promise<void> {
  const preApprovalTriggers: Partial<Record<AdmissionGateStatus, AdmissionGateStatus>> = {
    FORM_RECEIVED: 'FORM_APPROVED',
    VISIT_COMPLETED: 'VISIT_APPROVED',
    INTERVIEW_COMPLETED: 'VISIT_APPROVED',
    EVALUATION_PENDING: 'EVALUATION_COMPLETED',
    ENROLLMENT_COMPLETED: 'CONTRACT_PENDING',
  };

  const nextApprovalGate = preApprovalTriggers[newStatus];
  if (!nextApprovalGate) return;

  try {
    const GateApprovalService = await import('../gate-approval.service.js');
    await GateApprovalService.createApprovalsForGate(leadId, nextApprovalGate, userId);
  } catch (err) {
    logger.warn('Failed to create proactive approvals', {
      leadId,
      newStatus,
      nextApprovalGate,
      error: (err as Error).message,
    });
  }
}

/**
 * Fire-and-forget side effects after a successful gate transition: events,
 * gate-specific emails, ENROLLED welcome+students, proactive approvals.
 * Excludes auto-advance (handled separately) since auto-advance recurses
 * into another transition.
 */
export async function runGateNotifications(
  newStatus: AdmissionGateStatus,
  leadId: string,
  userId: string,
  notes?: string,
): Promise<void> {
  await publishGateEvents(leadId);
  await dispatchGateEmail(newStatus, leadId, notes);

  if (newStatus === 'ENROLLED') {
    await dispatchEnrolledWelcomeAndStudents(leadId, userId);
  }

  await createProactiveApprovals(newStatus, leadId, userId);
}
