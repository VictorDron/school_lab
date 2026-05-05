import { Request, Response } from 'express';
import * as ClickSignService from '../../services/clicksign.service.js';
import * as ContractService from '../../services/contract.service.js';
import * as AddendumService from '../../services/addendum.service.js';
import logger from '../../utils/logger.js';

/**
 * POST /public/webhooks/clicksign - ClickSign webhook handler
 * No JWT, HMAC verification using raw body buffer
 */
export async function handleClickSignWebhook(req: Request, res: Response) {
  try {
    const hmacHeader = req.headers['content-hmac'] as string || req.headers['x-clicksign-hmac'] as string || '';
    const rawBody = (req as any).rawBody?.toString('utf-8') ?? JSON.stringify(req.body);

    logger.info('ClickSign webhook received', {
      eventName: req.body?.event?.name,
      documentKey: req.body?.document?.key,
      hmacHeader: hmacHeader ? hmacHeader.substring(0, 20) + '...' : 'MISSING',
      hmacHeaderName: req.headers['content-hmac'] ? 'content-hmac' : req.headers['x-clicksign-hmac'] ? 'x-clicksign-hmac' : 'NONE',
      hasRawBody: !!(req as any).rawBody,
    });

    if (!hmacHeader) {
      logger.warn('ClickSign webhook missing HMAC header — rejecting');
      return res.status(401).json({ success: false, error: 'Missing HMAC signature' });
    }

    if (!ClickSignService.verifyWebhookHmac(rawBody, hmacHeader)) {
      logger.warn('ClickSign webhook HMAC verification failed', { hmacHeader: hmacHeader.substring(0, 30) });
      return res.status(401).json({ success: false, error: 'Invalid HMAC signature' });
    }

    let eventName = req.body?.event?.name;
    const documentKey = req.body?.document?.key || req.body?.envelope?.id;

    if (eventName === 'auto_close' || eventName === 'document_closed') {
      logger.info('ClickSign webhook: normalizing event to close', { originalEvent: eventName });
      eventName = 'close';
    }

    logger.info('ClickSign webhook parsed', { eventName, documentKey, hasBody: !!req.body });

    if (documentKey && eventName) {
      await ContractService.handleWebhookEvent(documentKey, eventName, req.body);

      const signerKey = req.body?.signer?.key || req.body?.account?.key;
      const addendumEventMap: Record<string, string> = { sign: 'signer_signed', close: 'envelope_completed', cancel: 'envelope_cancelled' };
      const addendumEvent = addendumEventMap[eventName];
      if (addendumEvent) {
        await AddendumService.handleAddendumWebhook(documentKey, addendumEvent, { signerKey });
      }

      logger.info('ClickSign webhook processed successfully', { eventName, documentKey });
    } else {
      logger.warn('ClickSign webhook missing documentKey or eventName', { eventName, documentKey, bodyKeys: Object.keys(req.body || {}) });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('ClickSign webhook error:', error);
    res.status(200).json({ success: true }); // Always return 200 to prevent retries
  }
}
