import { prisma } from '../../../config/database.js';
import logger from '../../../utils/logger.js';
import { redis } from '../../../config/redis.js';
import { getIO } from '../../../socket/io.js';
import { handleSignedCompletion } from './signed-completion.js';

/**
 * Handles incoming ClickSign webhook events.
 * Logs the event and updates contract/signer state accordingly.
 * For critical events (sign, close, auto_close, document_closed, refusal, cancel),
 * retries with exponential backoff if the contract is not yet found (race condition).
 */
export async function handleWebhookEvent(
  envelopeId: string,
  eventType: string,
  payload: any,
) {
  const log = await prisma.clickSignWebhookLog.create({
    data: {
      envelopeId,
      eventType,
      payload,
    },
  });

  logger.info('[Webhook] Processing event', { envelopeId, eventType });

  let contract = await prisma.contract.findUnique({
    where: { clicksignEnvelopeId: envelopeId },
    include: { signers: true },
  });

  if (!contract) {
    const isNonCritical = ['upload', 'add_signer', 'add_image', 'signature_started'].includes(eventType);

    if (!isNonCritical) {
      // Critical event — retry with exponential backoff (contract may not be saved yet due to race condition)
      const retryDelays = [1000, 3000, 8000];
      for (const delay of retryDelays) {
        logger.info(`[Webhook] Contract not found for critical event '${eventType}', retrying in ${delay}ms`, { envelopeId });
        await new Promise((resolve) => setTimeout(resolve, delay));
        contract = await prisma.contract.findUnique({
          where: { clicksignEnvelopeId: envelopeId },
          include: { signers: true },
        });
        if (contract) break;
      }
    }

    if (!contract) {
      await prisma.clickSignWebhookLog.update({
        where: { id: log.id },
        data: {
          error: isNonCritical ? null : 'Contract not found for envelope (after retry)',
          processed: true,
        },
      });
      return;
    }
  }

  try {
    switch (eventType) {
      case 'sign': {
        // v1 format: payload.event.data.signer.key or payload.data.signer.key
        // v3 format: payload.data.id or payload.signer_id
        const clicksignSignerId =
          payload?.event?.data?.signer?.key ?? payload?.data?.signer?.key ??
          payload?.data?.id ?? payload?.signer_id ?? null;
        if (clicksignSignerId) {
          await prisma.contractSigner.updateMany({
            where: {
              contractId: contract.id,
              clicksignSignerId,
            },
            data: {
              hasSigned: true,
              signedAt: new Date(),
            },
          });
        }
        break;
      }

      case 'close':
      case 'auto_close':
      case 'document_closed': {
        await handleSignedCompletion(contract, envelopeId, eventType);
        break;
      }

      case 'refusal': {
        const refusedSignerId =
          payload?.data?.id ?? payload?.signer_id ?? null;
        const reason =
          payload?.data?.attributes?.refusal_reason ??
          payload?.reason ??
          null;
        if (refusedSignerId) {
          await prisma.contractSigner.updateMany({
            where: {
              contractId: contract.id,
              clicksignSignerId: refusedSignerId,
            },
            data: {
              refusedAt: new Date(),
              refusalReason: reason,
            },
          });
        }
        break;
      }

      case 'cancel': {
        await prisma.contract.update({
          where: { id: contract.id },
          data: {
            status: 'CANCELLED',
            clicksignStatus: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: payload?.reason ?? 'Cancelled via ClickSign',
          },
        });
        break;
      }
    }

    await prisma.clickSignWebhookLog.update({
      where: { id: log.id },
      data: { processed: true },
    });

    // Emit CRM update event so open tabs reflect contract state changes
    try {
      await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:updated', leadId: contract.leadId }));
      getIO().to(`lead:${contract.leadId}`).emit('crm:lead:updated', { leadId: contract.leadId });
    } catch (err) {
      logger.warn('CRM event publish failed:', err);
    }
  } catch (err: any) {
    await prisma.clickSignWebhookLog.update({
      where: { id: log.id },
      data: { error: err.message, processed: true },
    });
    throw err;
  }
}
