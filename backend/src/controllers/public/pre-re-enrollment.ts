import { Request, Response } from 'express';
import * as PreReEnrollmentCommService from '../../services/re-enrollment-communication.service.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';
import { preReEnrollmentResponseSchema } from '../../schemas/public.schemas.js';

/**
 * GET /public/pre-reenrollment/:token - Load response data for public page
 */
export async function getPreReEnrollmentData(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const data = await PreReEnrollmentCommService.getResponseData(token);
    return res.json({ success: true, data });
  } catch (err: any) {
    if (err.message === 'RESPONSE_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Link inválido ou expirado.' });
    }
    logger.error('Pre-re-enrollment response data failed', { error: (err as Error).message });
    return res.status(500).json({ success: false, error: 'Erro interno.' });
  }
}

/**
 * POST /public/pre-reenrollment/:token/respond - Submit response (agree/disagree)
 */
export async function submitPreReEnrollmentResponse(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { response, reason } = preReEnrollmentResponseSchema.parse(req.body);

    const result = await PreReEnrollmentCommService.recordResponse(token, response, reason);

    try {
      getIO()
        .to(`pre-reenrollment:${result.periodId}`)
        .emit('pre-reenrollment:response:updated', {
          periodId: result.periodId,
          studentId: result.studentId,
          status: result.status,
        });
    } catch {
      // non-fatal: socket may not be initialized
    }

    return res.json({
      success: true,
      data: {
        status: result.status,
        reEnrollmentToken: result.reEnrollmentToken || null,
      },
    });
  } catch (err: any) {
    if (err.message === 'RESPONSE_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Link inválido ou expirado.' });
    }
    if (err.message === 'ALREADY_RESPONDED') {
      return res.status(409).json({ success: false, error: 'Você já respondeu a esta comunicação.' });
    }
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Dados inválidos.' });
    }
    logger.error('Pre-re-enrollment response submission failed', { error: (err as Error).message });
    return res.status(500).json({ success: false, error: 'Erro interno.' });
  }
}
