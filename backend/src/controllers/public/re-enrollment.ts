import { Request, Response } from 'express';
import { z } from 'zod';
import * as EnrollmentService from '../../services/enrollment.service.js';
import * as FormService from '../../services/re-enrollment-form.service.js';
import { findInviteByToken } from '../../services/re-enrollment-invite.service.js';
import logger from '../../utils/logger.js';
import { validateMagicBytes } from '../../middlewares/upload.js';
import { reEnrollmentFormSchema } from '../../schemas/public.schemas.js';

/**
 * GET /public/re-enrollment/:token - Get form data pre-populated from Lead entities
 */
export async function getReEnrollmentForm(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const metadata = { ipAddress: req.ip || req.socket?.remoteAddress, userAgent: req.get('User-Agent') };
    const formData = await FormService.getFormData(token, metadata);

    res.json({ success: true, data: formData });
  } catch (err: any) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
    }
    logger.error('Re-enrollment form data load failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao carregar dados do formulário.' });
  }
}

/**
 * POST /public/re-enrollment/:token - Submit re-enrollment form
 */
export async function submitReEnrollmentForm(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const data = reEnrollmentFormSchema.parse(req.body);
    const metadata = { ipAddress: req.ip || req.socket?.remoteAddress, userAgent: req.get('User-Agent') };

    const result = await FormService.submitForm(token, data, metadata);

    res.json({ success: true, data: result });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const details = err.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
      logger.warn('Re-enrollment form validation failed', { details });
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details,
      });
    }
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
    }
    logger.error('Re-enrollment form submission failed', { error: (err as Error).message, stack: (err as Error).stack });
    res.status(500).json({ success: false, error: 'Erro ao processar o formulário.' });
  }
}

/**
 * POST /public/re-enrollment/:token/documents - Upload documents via re-enrollment form
 */
export async function uploadReEnrollmentDocuments(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }

    for (const file of files) {
      if (!validateMagicBytes(file.buffer)) {
        return res.status(422).json({
          success: false,
          error: 'Tipo de arquivo inválido. O conteúdo do arquivo não corresponde ao tipo declarado.',
        });
      }
    }

    const invite = await findInviteByToken(token);

    const uploadedDocuments = await EnrollmentService.uploadEnrollmentDocumentsBatch(
      { id: invite.student.leadId },
      files,
      {
        documentType: req.body.documentType,
        category: req.body.category,
        childId: req.body.childId || invite.student.leadChildId || undefined,
      }
    );

    res.status(201).json({
      success: true,
      message: `${uploadedDocuments.length} documento(s) enviado(s) com sucesso`,
      data: uploadedDocuments,
    });
  } catch (err: any) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
    }
    if (err instanceof Error && err.message === 'DOCUMENT_LIMIT_EXCEEDED') {
      return res.status(400).json({
        success: false,
        error: 'Limite de documentos atingido (máximo 50).',
        code: 'DOCUMENT_LIMIT_EXCEEDED',
      });
    }
    logger.error('Re-enrollment document upload error:', err);
    res.status(500).json({ success: false, error: 'Erro ao enviar documentos.' });
  }
}
