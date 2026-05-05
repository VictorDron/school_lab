import type { Lead } from '@prisma/client';
import type { Request } from 'express';
import { sendAdmissionConfirmationEmail } from '../email.service.js';
import { createAuditLog } from '../audit.service.js';
import { notifyAdminsOfFormSubmission } from '../notifications.service.js';
import { deleteDraft } from '../formDraft.service.js';
import logger from '../../utils/logger.js';

interface PostSubmitInput {
  lead: Lead;
  studentName: string;
  motherEmail: string;
  motherName: string;
  applicationToken: string | undefined;
  req?: Request;
}

const ADMIN_NOTIFY_DELAY_MS = 600;

/**
 * Best-effort gate advance. The gate may already be past FORM_RECEIVED if
 * an admin manually advanced things, so we swallow any transition error.
 */
async function tryAdvanceGate(leadId: string): Promise<void> {
  try {
    const AdmissionGateService = await import('../admission-gate.service.js');
    await AdmissionGateService.transition(leadId, 'FORM_RECEIVED', 'system');
  } catch {
    /* gate may already be past this step */
  }
}

/**
 * Send the family confirmation, then — after a short delay — fan out the
 * admin notification. The delay is here to stay under Resend's per-second
 * rate limit; the admin function has its own internal throttling for the
 * fan-out, this just spaces the *first* admin call from the confirmation.
 *
 * Errors are logged, never thrown — the submission has already committed.
 */
async function sendSubmissionEmails(
  lead: Lead,
  studentName: string,
  motherEmail: string,
  motherName: string,
): Promise<void> {
  try {
    await sendAdmissionConfirmationEmail({
      to: motherEmail,
      parentName: motherName,
      studentName,
      leadCode: lead.code,
    });
  } catch (err) {
    logger.error('Failed to send confirmation email:', err);
  }

  await new Promise(resolve => setTimeout(resolve, ADMIN_NOTIFY_DELAY_MS));

  try {
    await notifyAdminsOfFormSubmission(lead, studentName);
  } catch (err) {
    logger.error('Failed to notify admins:', err);
  }
}

/**
 * Run every side effect that must NOT roll back with the submission: gate
 * advance, draft cleanup, audit trail, and the email fan-out. The email
 * fan-out runs detached so the controller's response doesn't wait on
 * Resend's network round-trips.
 */
export async function runPostSubmit(input: PostSubmitInput): Promise<void> {
  const { lead, studentName, motherEmail, motherName, applicationToken, req } = input;

  await tryAdvanceGate(lead.id);

  if (applicationToken) {
    deleteDraft(applicationToken, 'ADMISSION').catch(() => {});
  }

  await createAuditLog({
    actorEmail: motherEmail,
    action: 'LEAD_UPDATED',
    entityType: 'LEAD',
    entityId: lead.id,
    metadata: {
      source: 'PUBLIC_FORM',
      familyName: lead.familyName,
      studentName,
      formSubmissionCount: lead.formSubmissionCount,
    },
  }, req);

  void sendSubmissionEmails(lead, studentName, motherEmail, motherName);
}
