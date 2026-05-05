import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';

export async function handleAddendumWebhook(envelopeId: string, event: string, data: any) {
  const addendum = await prisma.contractAddendum.findFirst({
    where: { clicksignEnvelopeId: envelopeId },
    include: { signers: true },
  });

  if (!addendum) {
    logger.warn(`Addendum webhook: no addendum found for envelope ${envelopeId}`);
    return;
  }

  // Handle signer event
  if (event === 'signer_signed' && data?.signerKey) {
    const signer = addendum.signers.find((s) => s.clicksignSignerId === data.signerKey);
    if (signer) {
      await prisma.addendumSigner.update({
        where: { id: signer.id },
        data: { hasSigned: true, signedAt: new Date() },
      });
      logger.info(`Addendum signer signed: ${signer.name} on ${addendum.code}`);
    }
  }

  // Handle envelope completed
  if (event === 'envelope_completed') {
    await prisma.contractAddendum.update({
      where: { clicksignEnvelopeId: envelopeId },
      data: {
        status: 'SIGNED',
        clicksignStatus: 'COMPLETED',
        signedAt: new Date(),
      },
    });

    logger.info(`Addendum fully signed: ${addendum.code}`);
  }

  // Handle envelope cancelled
  if (event === 'envelope_cancelled') {
    await prisma.contractAddendum.update({
      where: { clicksignEnvelopeId: envelopeId },
      data: {
        status: 'CANCELLED',
        clicksignStatus: 'CANCELLED',
      },
    });

    logger.info(`Addendum cancelled via webhook: ${addendum.code}`);
  }
}
