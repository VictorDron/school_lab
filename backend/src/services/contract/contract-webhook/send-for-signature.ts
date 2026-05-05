import { prisma } from '../../../config/database.js';
import * as ClickSignService from '../../clicksign.service.js';
import { contractInclude } from '../contract-core.service.js';
import { generateContractDocument } from '../contract-pdf.service.js';
import logger from '../../../utils/logger.js';
import { createAppError } from '../../../lib/error-messages.js';
import { AppError } from '../../../middlewares/errorHandler.js';
import { redis } from '../../../config/redis.js';
import { getIO } from '../../../socket/io.js';

/**
 * Orchestrates sending a contract for signature via ClickSign:
 * 1. Create envelope
 * 2. Upload document
 * 3. Add each signer
 * 4. Add requirements linking signers to documents
 * 5. Activate the envelope
 * 6. Notify signers
 */
export async function sendForSignature(contractId: string, userId: string) {
  let contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { signers: true },
  });

  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');

  // ClickSign idempotency: if envelope already exists, check its status before creating new
  if (contract.clicksignEnvelopeId) {
    try {
      const existingDoc = await ClickSignService.getDocument(contract.clicksignEnvelopeId);
      const docStatus = existingDoc?.document?.status;

      // If document is still valid (running, waiting_signatories), reuse it
      if (docStatus && !['cancelled', 'expired', 'declined'].includes(docStatus)) {
        logger.info('Reusing existing ClickSign document', { contractId, documentKey: contract.clicksignEnvelopeId, status: docStatus });
        return prisma.contract.findUnique({ where: { id: contractId }, include: contractInclude });
      }

      // Document is invalid — allow recreation by clearing the envelope reference
      logger.info('Existing ClickSign document is invalid, recreating', { contractId, documentKey: contract.clicksignEnvelopeId, status: docStatus });
      await prisma.contract.update({
        where: { id: contractId },
        data: { clicksignEnvelopeId: null, clicksignStatus: null, clicksignEnvelopeUrl: null },
      });
      // Refresh contract object
      contract = await prisma.contract.findUnique({ where: { id: contractId }, include: { signers: true } });
      if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
    } catch (err) {
      // If ClickSign API is unreachable, don't block — treat as invalid and recreate
      if (!(err instanceof AppError)) {
        logger.warn('ClickSign status check failed, treating as invalid', { contractId, error: (err as Error).message });
        await prisma.contract.update({
          where: { id: contractId },
          data: { clicksignEnvelopeId: null, clicksignStatus: null, clicksignEnvelopeUrl: null },
        });
        contract = await prisma.contract.findUnique({ where: { id: contractId }, include: { signers: true } });
        if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
      } else {
        throw err;
      }
    }
  }

  // Require both legal and financial approvals before sending to ClickSign
  if (contract.legalApprovalStatus !== 'APPROVED' || contract.financialApprovalStatus !== 'APPROVED') {
    throw createAppError('CONTRACT_NOT_FULLY_APPROVED');
  }
  // Require school representative and 2 witnesses (FIRST enrollment only)
  // RENEWAL contracts are pre-approved and only need parent/guardian signers
  if (contract.enrollmentType !== 'RENEWAL') {
    const schoolReps = contract.signers.filter(s => s.role === 'SCHOOL_REPRESENTATIVE');
    const witnesses = contract.signers.filter(s => s.role === 'WITNESS');
    if (schoolReps.length < 1 || witnesses.length < 2) {
      throw createAppError('CONTRACT_MISSING_REQUIRED_SIGNERS');
    }
  }

  // Auto-generate document if missing
  if (!contract.documentUrl) {
    const updated = await generateContractDocument(contractId);
    contract = {
      ...contract,
      documentUrl: updated.documentUrl,
    };
  }

  // Resolve base64 content for ClickSign upload
  let base64Content: string;
  if (contract.documentUrl!.startsWith('http')) {
    // documentUrl is a Supabase URL — download and convert to base64
    let response = await fetch(contract.documentUrl!);
    if (!response.ok) {
      // URL may have expired (Supabase signed URLs last 7 days) — regenerate document
      logger.info('Supabase URL expired, regenerating contract document', { contractId });
      const regenerated = await generateContractDocument(contractId);
      contract = { ...contract, documentUrl: regenerated.documentUrl };
      response = await fetch(contract.documentUrl!);
      if (!response.ok) {
        throw createAppError('CONTRACT_PDF_DOWNLOAD_FAILED');
      }
    }
    const arrayBuffer = await response.arrayBuffer();
    base64Content = Buffer.from(arrayBuffer).toString('base64');
  } else {
    // Legacy: documentUrl is already base64
    base64Content = contract.documentUrl!;
  }

  // 1. Create document in ClickSign (v1 API — documents are the main entity)
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const deadlineStr = deadline.toISOString().split('T')[0];

  let docResult;
  try {
    docResult = await ClickSignService.createDocument(
      base64Content,
      `${contract.code}.pdf`,
      deadlineStr,
    );
  } catch (err) {
    logger.error('ClickSign document creation failed', {
      contractId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw createAppError('CLICKSIGN_DOCUMENT_CREATION_FAILED');
  }
  const documentKey = docResult.document.key;
  logger.info('ClickSign document created', { contractId, documentKey });

  // 2. Create signers and link them to the document
  const notificationKeys: string[] = [];
  for (const signer of contract.signers) {
    // Create signer in ClickSign — name must have first + last name
    let signerResult;
    try {
      signerResult = await ClickSignService.createSigner(
        signer.email,
        signer.name,
        signer.cpf ?? undefined,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CLICKSIGN_SIGNER_INVALID_NAME') {
        logger.error('Signer has invalid name for ClickSign', { signerName: signer.name, signerEmail: signer.email });
        throw createAppError('CLICKSIGN_SIGNER_INVALID_NAME');
      }
      logger.error('ClickSign signer creation failed', {
        contractId,
        signerEmail: signer.email,
        error: err instanceof Error ? err.message : String(err),
      });
      throw createAppError('CLICKSIGN_SIGNER_CREATION_FAILED');
    }
    const signerKey = signerResult.signer.key;

    // Update signer record with ClickSign key
    await prisma.contractSigner.update({
      where: { id: signer.id },
      data: { clicksignSignerId: signerKey },
    });

    // Link signer to document (creates signing requirement)
    let listResult;
    try {
      listResult = await ClickSignService.addSignerToDocument(documentKey, signerKey, 'sign');
    } catch (err) {
      logger.error('ClickSign add signer to document failed', {
        contractId,
        documentKey,
        signerKey,
        error: err instanceof Error ? err.message : String(err),
      });
      throw createAppError('CLICKSIGN_ADD_SIGNER_FAILED');
    }
    const requestSignatureKey = listResult.list?.request_signature_key;
    if (requestSignatureKey) {
      notificationKeys.push(requestSignatureKey);
    }
  }

  // 3. Notify all signers via email
  for (const key of notificationKeys) {
    try {
      await ClickSignService.notifySigners(key);
    } catch (err) {
      logger.warn('ClickSign notification failed for key', { key, error: (err as Error).message });
    }
  }

  // 4. Update contract with ClickSign reference
  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      clicksignEnvelopeId: documentKey,
      clicksignStatus: 'RUNNING',
      clicksignEnvelopeUrl: null,
      status: 'SENT',
      sentAt: new Date(),
    },
    include: contractInclude,
  });

  // Record history
  await prisma.leadHistory.create({
    data: {
      leadId: contract.leadId,
      action: 'CONTRACT_SENT',
      actorId: userId,
      details: { contractId, documentKey },
    },
  });

  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:updated', leadId: contract.leadId }));
    getIO().to(`lead:${contract.leadId}`).emit('crm:lead:updated', { leadId: contract.leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  // Send contract-sent notification email for RENEWAL contracts (non-fatal) — REMAT-11
  if (contract.enrollmentType === 'RENEWAL') {
    try {
      const leadForEmail = await prisma.lead.findUnique({
        where: { id: contract.leadId },
        select: { primaryContactEmail: true, familyName: true },
      });
      if (leadForEmail?.primaryContactEmail) {
        const invite = await prisma.reEnrollmentInvite.findFirst({
          where: { student: { leadId: contract.leadId }, gateStatus: 'CONTRATO_PENDENTE' },
          include: { student: { select: { fullName: true } } },
        });
        const { sendReEnrollmentContractSentEmail } = await import('../../email.service.js');
        const { getOrCreateSettings } = await import('../../settings.service.js');
        const { getDefaultTenant } = await import('../../tenant.service.js');
        const { id: tenantId } = await getDefaultTenant();
        const { schoolName } = await getOrCreateSettings(tenantId);
        await sendReEnrollmentContractSentEmail({
          to: leadForEmail.primaryContactEmail,
          familyName: leadForEmail.familyName ?? '',
          studentName: invite?.student?.fullName ?? '',
          schoolName,
        });
      }
    } catch (emailErr) {
      logger.warn('Re-enrollment contract-sent email failed', { contractId: contract.id, error: (emailErr as Error).message });
    }
  }

  return updated;
}
