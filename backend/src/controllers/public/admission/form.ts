import { Request, Response } from 'express';
import { z } from 'zod';
import * as AdmissionsService from '../../../services/admissions.service.js';
import logger from '../../../utils/logger.js';
import { publicAdmissionSchema } from '../../../schemas/public.schemas.js';

/**
 * POST /public/admissions - Public admission form submission
 * Handles both new applications and updates via token
 */
export async function submitAdmission(req: Request, res: Response) {
  try {
    const data = publicAdmissionSchema.parse(req.body);

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await AdmissionsService.submitAdmissionForm(data, req, metadata);

    const statusCode = result.isUpdate ? 200 : 201;
    res.status(statusCode).json({
      success: true,
      message: result.message,
      data: { leadCode: result.leadCode },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Admission form validation errors:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
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
          error: 'Link de inscrição inválido. Verifique se o link está correto.',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de inscrição expirado. Solicite um novo link.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.message === 'MAX_SUBMISSIONS_EXCEEDED') {
        return res.status(429).json({
          success: false,
          error: 'Limite de envios atingido. Entre em contato com a escola para mais informacoes.',
          code: 'MAX_SUBMISSIONS_EXCEEDED',
        });
      }

      if (error.message === 'NO_COLUMN_FOUND') {
        return res.status(500).json({
          success: false,
          error: 'Sistema não configurado corretamente. Contate o administrador.',
        });
      }
    }

    logger.error('Public admission error:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar inscrição' });
  }
}

/**
 * GET /public/application/:token - Get lead data for pre-filling the form
 * Validates token and returns lead data if valid
 */
export async function getApplication(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const result = await AdmissionsService.getApplicationData(token, metadata);

    if (!result.success) {
      if (result.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de inscrição inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (result.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de inscrição expirado. Solicite um novo link.',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link de inscrição',
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Get application data error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar dados da inscrição' });
  }
}

/**
 * POST /public/application/:token/documents - Upload documents via public form
 * Validates token and uploads documents to the lead
 */
