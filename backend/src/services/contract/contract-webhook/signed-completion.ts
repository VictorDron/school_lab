import { prisma } from '../../../config/database.js';
import * as ClickSignService from '../../clicksign.service.js';
import * as AdmissionGateService from '../../admission-gate.service.js';
import logger from '../../../utils/logger.js';
import { redis } from '../../../config/redis.js';
import { getIO } from '../../../socket/io.js';
import { retryUpload } from './helpers.js';

interface ContractRef {
  id: string;
  code: string;
  leadId: string;
  enrollmentType: string;
}

/**
 * Download the signed PDF from ClickSign and store it permanently in Supabase.
 * Falls back to storing the (expiring) ClickSign URL if Supabase upload fails.
 */
async function persistSignedPdf(
  contract: ContractRef,
  envelopeId: string,
): Promise<void> {
  try {
    const docs = await ClickSignService.getEnvelopeDocuments(envelopeId);
    const clicksignUrl =
      docs?.data?.[0]?.attributes?.signed_url ??
      docs?.data?.[0]?.attributes?.download_url ??
      null;
    if (!clicksignUrl) return;

    const { default: axios } = await import('axios');
    const pdfResponse = await axios.get(clicksignUrl, { responseType: 'arraybuffer', timeout: 30000 });
    const pdfBuffer = Buffer.from(pdfResponse.data);

    const signedStoragePath = `contracts/${contract.id}/${contract.code}-signed.pdf`;
    const supabaseUrl = await retryUpload(pdfBuffer, signedStoragePath, 'application/pdf');

    if (supabaseUrl) {
      await prisma.contract.update({
        where: { id: contract.id },
        data: { signedDocumentUrl: signedStoragePath },
      });
      logger.info('[Webhook] Signed PDF stored in Supabase', { contractId: contract.id, path: signedStoragePath });
    } else {
      logger.warn('[Webhook] Supabase upload returned null, storing ClickSign URL', { contractId: contract.id });
      await prisma.contract.update({
        where: { id: contract.id },
        data: { signedDocumentUrl: clicksignUrl },
      });
    }
  } catch (dlErr) {
    logger.warn('[Webhook] Failed to download/store signed PDF, storing ClickSign URL as fallback', {
      contractId: contract.id,
      error: (dlErr as Error).message,
    });
    try {
      const docs2 = await ClickSignService.getEnvelopeDocuments(envelopeId);
      const fallbackUrl = docs2?.data?.[0]?.attributes?.signed_url ?? null;
      if (fallbackUrl) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { signedDocumentUrl: fallbackUrl },
        });
      }
    } catch {
      /* non-critical */
    }
  }
}

/**
 * RENEWAL contract completion: drive the re-enrollment gate flow forward.
 * Auto-completes the invite if the period does not require fee payment (legacy v2.0 behavior).
 */
async function completeRenewalFlow(contract: ContractRef): Promise<void> {
  try {
    const invite = await prisma.reEnrollmentInvite.findFirst({
      where: {
        student: { leadId: contract.leadId },
        gateStatus: 'CONTRATO_PENDENTE',
      },
      include: { student: true, period: true },
    });

    if (!invite) return;

    const ReEnrollmentGateService = await import('../../re-enrollment-gate.service.js');
    const StudentsService = await import('../../students/index.js');
    const { getNextGrade } = await import('../../grade-progression.js');

    await ReEnrollmentGateService.transitionGate(invite.id, 'CONTRATO_ASSINADO', 'system');

    if (invite.period.requiresFeePayment) return;

    // Legacy v2.0 behavior: create student and auto-complete to REMATRICULADO
    const nextGrade = getNextGrade(invite.student.grade ?? '');
    await StudentsService.createStudentFromReEnrollment(
      invite.student,
      invite.period.targetYear,
      nextGrade,
    );

    await ReEnrollmentGateService.transitionGate(invite.id, 'REMATRICULADO', 'system');

    try {
      const lead = await prisma.lead.findUnique({
        where: { id: contract.leadId },
        select: { primaryContactEmail: true, familyName: true },
      });
      if (lead?.primaryContactEmail) {
        const { sendReEnrollmentWelcomeEmail } = await import('../../email.service.js');
        await sendReEnrollmentWelcomeEmail({
          to: lead.primaryContactEmail,
          familyName: lead.familyName ?? '',
          studentName: invite.student.fullName,
          newGrade: nextGrade,
          targetYear: invite.period.targetYear,
        });
      }
    } catch (emailErr) {
      logger.warn('Re-enrollment welcome email failed', { inviteId: invite.id, error: (emailErr as Error).message });
    }

    try {
      await redis.publish('re-enrollment:invites', JSON.stringify({ type: 'invite:completed', inviteId: invite.id }));
      getIO().to(`re-enrollment:${invite.periodId}`).emit('re-enrollment:invite:updated', { inviteId: invite.id, newStatus: 'REMATRICULADO' });
    } catch (err) {
      logger.warn('Re-enrollment event publish failed:', err);
    }
  } catch (reEnrollErr) {
    logger.error('Re-enrollment completion failed during webhook', { contractId: contract.id, error: (reEnrollErr as Error).message });
  }
}

/**
 * FIRST enrollment completion: drive the admission gate forward through
 * CONTRACT_SIGNED → FINANCIAL_APPROVED (which auto-cascades to ENROLLED).
 */
async function completeFirstEnrollmentFlow(contract: ContractRef): Promise<void> {
  try {
    await AdmissionGateService.transition(
      contract.leadId,
      'CONTRACT_SIGNED',
      'system',
      undefined,
      true,
    );
  } catch {
    // Gate may already be past this step
  }

  try {
    await AdmissionGateService.transition(
      contract.leadId,
      'FINANCIAL_APPROVED',
      'system',
      'Contrato assinado por todas as partes',
      true,
    );
  } catch {
    // Gate may not be ready for this transition
  }
}

/**
 * Handle the close/auto_close/document_closed webhook events:
 * mark contract SIGNED, persist the signed PDF, run domain completion,
 * and finally activate the contract.
 */
export async function handleSignedCompletion(
  contract: ContractRef,
  envelopeId: string,
  eventType: string,
): Promise<void> {
  logger.info('[Webhook] All signers signed — advancing contract', { contractId: contract.id, eventType });
  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: 'SIGNED',
      clicksignStatus: 'COMPLETED',
      signedAt: new Date(),
    },
  });

  await persistSignedPdf(contract, envelopeId);

  if (contract.enrollmentType === 'RENEWAL') {
    await completeRenewalFlow(contract);
  } else {
    await completeFirstEnrollmentFlow(contract);
  }

  try {
    await prisma.contract.update({
      where: { id: contract.id },
      data: { status: 'ACTIVE', activatedAt: new Date() },
    });
  } catch (err) {
    logger.error('Failed to set contract to ACTIVE after signing', { contractId: contract.id, error: (err as Error).message });
  }
}
