import { prisma } from '../../config/database.js';
import * as ClickSignService from '../clicksign.service.js';
import { getSignedUrl } from '../../config/supabase.js';
import logger from '../../utils/logger.js';

export async function sendAddendumForSignature(addendumId: string, userId: string) {
  const addendum = await prisma.contractAddendum.findUnique({
    where: { id: addendumId },
    include: { signers: true },
  });

  if (!addendum) {
    throw new Error('ADDENDUM_NOT_FOUND');
  }

  if (!addendum.documentUrl) {
    throw new Error('ADDENDUM_NO_DOCUMENT');
  }

  // Download PDF from Supabase and convert to base64 for ClickSign upload
  const signedUrl = await getSignedUrl(addendum.documentUrl);
  if (!signedUrl) {
    throw new Error('ADDENDUM_DOCUMENT_URL_FAILED');
  }
  const response = await fetch(signedUrl);
  const base64Content = Buffer.from(await response.arrayBuffer()).toString('base64');

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const deadlineStr = deadline.toISOString().split('T')[0];

  const docResult = await ClickSignService.createDocument(
    base64Content,
    `aditivo-${addendum.code}.pdf`,
    deadlineStr,
  );
  const documentKey = docResult.document.key;

  // Add signers and link them to the document
  const notificationKeys: string[] = [];
  for (const signer of addendum.signers) {
    const signerResult = await ClickSignService.createSigner(
      signer.email,
      signer.name,
      signer.cpf ?? undefined,
    );
    const signerKey = signerResult.signer.key;

    // Store ClickSign signer ID
    await prisma.addendumSigner.update({
      where: { id: signer.id },
      data: { clicksignSignerId: signerKey, clicksignAuthMethod: 'email' },
    });

    // Link signer to document (creates signing requirement)
    const listResult = await ClickSignService.addSignerToDocument(documentKey, signerKey, 'sign');
    const requestSignatureKey = listResult.list?.request_signature_key;
    if (requestSignatureKey) {
      notificationKeys.push(requestSignatureKey);
    }
  }

  // Notify all signers via email
  for (const key of notificationKeys) {
    try {
      await ClickSignService.notifySigners(key);
    } catch (err) {
      logger.warn('ClickSign addendum notification failed', { key, error: (err as Error).message });
    }
  }

  // Update addendum status
  const updated = await prisma.contractAddendum.update({
    where: { id: addendumId },
    data: {
      status: 'PENDING_SIGNATURE',
      clicksignEnvelopeId: documentKey,
      clicksignStatus: 'RUNNING',
      clicksignEnvelopeUrl: `https://app.clicksign.com/documents/${documentKey}`,
    },
    include: { signers: true },
  });

  logger.info(`Addendum sent for signature: ${addendum.code}, document: ${documentKey}`);
  return updated;
}
