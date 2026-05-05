import { Request, Response } from 'express';
import { z } from 'zod';
import * as EnrollmentService from '../../../services/enrollment.service.js';
import logger from '../../../utils/logger.js';
import { publicEnrollmentSchema } from '../../../schemas/public.schemas.js';

/**
 * GET /public/enrollment/:token - Get enrollment data for pre-filling the form
 * Returns data from admission form (Form 1) plus any existing enrollment data
 */
export async function getEnrollmentData(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await EnrollmentService.getEnrollmentData(token, metadata);

    if (!result.success) {
      if (result.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de matrícula inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (result.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de matrícula expirado. Solicite um novo link.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (result.error === 'ADMISSION_NOT_COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'Formulário de admissão não foi preenchido. Complete a admissão primeiro.',
          code: 'ADMISSION_NOT_COMPLETED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link de matrícula',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get enrollment data error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar dados da matrícula' });
  }
}

/**
 * POST /public/enrollment - Submit enrollment form
 */
export async function submitEnrollment(req: Request, res: Response) {
  try {
    const data = publicEnrollmentSchema.parse(req.body);

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await EnrollmentService.submitEnrollmentForm(data, req, metadata);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { leadCode: result.leadCode },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorSummary = error.errors.map(e => ({ path: e.path.join('.'), message: e.message, code: e.code }));
      logger.error('Enrollment Zod validation errors: ' + JSON.stringify(errorSummary));
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: errorSummary,
      });
    }

    if (error instanceof Error) {
      if (error.message === 'TOKEN_REQUIRED') {
        return res.status(400).json({
          success: false,
          error: 'Este formulário só pode ser acessado através de um link enviado pela escola.',
          code: 'TOKEN_REQUIRED',
        });
      }

      if (error.message === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de matrícula inválido.',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de matrícula expirado. Solicite um novo link.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.message === 'ADMISSION_NOT_COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'Formulário de admissão não foi preenchido. Complete a admissão primeiro.',
          code: 'ADMISSION_NOT_COMPLETED',
        });
      }

      if (error.message === 'ENROLLMENT_ALREADY_COMPLETED') {
        return res.status(409).json({
          success: false,
          error: 'A matrícula já foi concluída. Não é possível reenviar.',
          code: 'ENROLLMENT_ALREADY_COMPLETED',
        });
      }

      if (error.message === 'MAX_SUBMISSIONS_EXCEEDED') {
        return res.status(429).json({
          success: false,
          error: 'Limite de envios atingido. Entre em contato com a escola.',
          code: 'MAX_SUBMISSIONS_EXCEEDED',
        });
      }

      if (error.message === 'TERMS_NOT_ACCEPTED') {
        return res.status(400).json({
          success: false,
          error: 'Os termos e condicoes devem ser aceitos.',
          code: 'TERMS_NOT_ACCEPTED',
        });
      }

      if (error.message === 'APPLICANT_NOT_FOUND') {
        return res.status(400).json({
          success: false,
          error: 'Aluno não encontrado. Verifique se a admissão foi preenchida corretamente.',
          code: 'APPLICANT_NOT_FOUND',
        });
      }

      if (error.message === 'INVALID_CHILD_ID') {
        return res.status(400).json({
          success: false,
          error: 'ID de aluno inválido. Verifique os dados enviados.',
          code: 'INVALID_CHILD_ID',
        });
      }
    }

    logger.error('Public enrollment error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar matrícula' });
  }
}
