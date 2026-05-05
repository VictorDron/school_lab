import type { Request } from 'express';
import type { Lead } from '@prisma/client';
import { prisma } from '../../../config/database.js';
import logger from '../../../utils/logger.js';
import { sendEnrollmentConfirmationEmail } from '../../email.service.js';
import { createAuditLog } from '../../audit.service.js';
import { notifyAdminsOfEnrollmentSubmission } from '../../notifications.service.js';
import { deleteDraft } from '../../formDraft.service.js';
import type { RequestMetadata } from '../../../types/enrollment.types.js';

const PARENTAL_CONSENT_VERSION = 'v1.0';

interface PostSubmitContext {
  lead: Lead;
  studentName: string;
  motherEmail: string | null | undefined;
  enrollmentToken: string;
  req?: Request;
  metadata?: RequestMetadata;
}

/**
 * Advance the admission gate to ENROLLMENT_COMPLETED. The gate machine has
 * its own valid-transition rules; if the lead is already past this step the
 * call throws and we swallow it — the gate state is the source of truth.
 *
 * Dynamic import keeps the cycle between admission-gate and enrollment-form
 * services from forming at module-load time.
 */
async function advanceAdmissionGate(leadId: string): Promise<void> {
  try {
    const AdmissionGateService = await import('../../admission-gate.service.js');
    await AdmissionGateService.transition(leadId, 'ENROLLMENT_COMPLETED', 'system');
  } catch {
    // Gate may already be past this step — no recovery needed.
  }
}

/**
 * Record the family's consent for LGPD/Lei 15.211/2025 (SEC-05). The audit
 * log is paired with the consent row so each ParentalConsent has a matching
 * audit trail. Failures here are non-fatal: the enrollment was already
 * committed in the parent transaction, we just log and move on.
 */
async function captureParentalConsent(ctx: PostSubmitContext): Promise<void> {
  try {
    await prisma.parentalConsent.create({
      data: {
        leadId: ctx.lead.id,
        ipAddress: ctx.metadata?.ipAddress ?? null,
        userAgent: ctx.metadata?.userAgent ?? null,
        consentTextVersion: PARENTAL_CONSENT_VERSION,
      },
    });

    await createAuditLog({
      actorEmail: 'public-form',
      action: 'PARENTAL_CONSENT_RECORDED',
      entityType: 'LEAD',
      entityId: ctx.lead.id,
      metadata: { consentTextVersion: PARENTAL_CONSENT_VERSION, ipAddress: ctx.metadata?.ipAddress },
    }, ctx.req);
  } catch (consentError) {
    logger.error('Failed to record parental consent', {
      leadId: ctx.lead.id,
      error: consentError instanceof Error ? consentError.message : String(consentError),
    });
  }
}

/**
 * Fire-and-forget email pipeline: confirmation to the mother, then a short
 * delay to space the SMTP calls, then admin notification. Each call is
 * independently try/catch'd so one failure doesn't block the other.
 */
function sendNotificationsAsync(ctx: PostSubmitContext): void {
  void (async () => {
    try {
      if (ctx.motherEmail) {
        await sendEnrollmentConfirmationEmail({
          to: ctx.motherEmail,
          studentName: ctx.studentName,
          leadCode: ctx.lead.code,
        });
      }
    } catch (err) {
      logger.error('Failed to send enrollment confirmation email:', err);
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      await notifyAdminsOfEnrollmentSubmission(ctx.lead, ctx.studentName);
    } catch (err) {
      logger.error('Failed to notify admins of enrollment:', err);
    }
  })();
}

/**
 * Run every non-critical step that follows a successful enrollment commit:
 * advance the admission gate, drop the draft, write the lead-update audit
 * log, capture parental consent, and queue the email notifications. Each is
 * isolated so a single failure can't tear down the whole post-commit flow.
 */
export async function runPostSubmit(ctx: PostSubmitContext): Promise<void> {
  await advanceAdmissionGate(ctx.lead.id);

  // deleteDraft returns a promise we deliberately don't await — losing the
  // draft is harmless and we don't want to block the response on it.
  deleteDraft(ctx.enrollmentToken, 'ENROLLMENT').catch(() => {});

  await createAuditLog({
    actorEmail: ctx.motherEmail || 'family@form.submission',
    action: 'LEAD_UPDATED',
    entityType: 'LEAD',
    entityId: ctx.lead.id,
    metadata: {
      source: 'PUBLIC_ENROLLMENT_FORM',
      familyName: ctx.lead.familyName,
      studentName: ctx.studentName,
      enrollmentSubmissionCount: ctx.lead.enrollmentSubmissionCount,
    },
  }, ctx.req);

  await captureParentalConsent(ctx);

  sendNotificationsAsync(ctx);
}
