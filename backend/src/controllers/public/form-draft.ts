import { Request, Response } from 'express';
import { z } from 'zod';
import * as FormDraftService from '../../services/formDraft.service.js';
import logger from '../../utils/logger.js';
import { formDraftSchema } from '../../schemas/public.schemas.js';

/**
 * PUT /public/form-draft/:token - Save form draft checkpoint
 */
export async function saveFormDraft(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { formType, data, step } = formDraftSchema.parse(req.body);

    // Validate token exists on a lead and has not expired (SEC-03)
    const tokenCheck = await FormDraftService.validateDraftToken(token);
    if (!tokenCheck.valid) {
      if (tokenCheck.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Token inválido' });
      }
      return res.status(410).json({
        success: false,
        error: 'Link expirado. Solicite um novo link.',
        code: 'TOKEN_EXPIRED',
      });
    }

    await FormDraftService.upsertDraft(token, formType, data, step);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Save form draft error:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar rascunho' });
  }
}

/**
 * GET /public/form-draft/:token - Get form draft checkpoint
 * Query: ?type=ADMISSION|ENROLLMENT
 */
export async function getFormDraft(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const formType = req.query.type as string;

    if (!formType || !['ADMISSION', 'ENROLLMENT'].includes(formType)) {
      return res.status(400).json({ success: false, error: 'Tipo de formulário inválido' });
    }

    // Validate token exists and has not expired (SEC-03)
    const tokenCheck = await FormDraftService.validateDraftToken(token);
    if (!tokenCheck.valid) {
      if (tokenCheck.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Token inválido' });
      }
      return res.status(410).json({
        success: false,
        error: 'Link expirado. Solicite um novo link.',
        code: 'TOKEN_EXPIRED',
      });
    }

    const draft = await FormDraftService.getDraft(token, formType as any);

    res.json({ success: true, data: draft });
  } catch (error) {
    logger.error('Get form draft error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar rascunho' });
  }
}
