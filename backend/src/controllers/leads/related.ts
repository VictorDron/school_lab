import { CommentType } from '@prisma/client';
import type { Response } from 'express';
import { z } from 'zod';
import * as LeadsService from '../../services/leads/index.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import logger from '../../utils/logger.js';
import {
  createEmergencyContactSchema,
  updateAddressSchema,
  updateChildHealthSchema,
  updateChildSchema,
  updateChildTransportSchema,
  updateEmergencyContactSchema,
  updateFinancialResponsibleSchema,
  updateHealthPlanSchema,
  updateParentSchema,
} from './schemas.js';

const VALID_COMMENT_TYPES: CommentType[] = ['GENERAL', 'POSITIVE', 'CONCERN', 'INTERNAL'];

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { content, type = 'GENERAL' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Conteúdo obrigatório' });
    }

    if (!VALID_COMMENT_TYPES.includes(type as CommentType)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de comentário inválido. Valores permitidos: ${VALID_COMMENT_TYPES.join(', ')}`,
      });
    }

    const comment = await LeadsService.addComment(
      req.params.id,
      req.user!.id,
      content,
      type as CommentType,
    );

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Comment deletion is gated server-side: the service returns the
 * comment so we can verify ownership (or ADMIN) before reporting
 * success. The service performs the actual delete by id.
 */
export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    const comment = await LeadsService.deleteComment(req.params.commentId, req.params.id);

    if (comment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Apenas o autor pode deletar o comentário' });
    }

    res.json({ success: true, message: 'Comentário deletado com sucesso' });
  } catch (error) {
    if (error instanceof Error && error.message === 'COMMENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Comentário não encontrado' });
    }
    logger.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function addChild(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      nationality,
      desiredGrade,
      currentSchool,
      specialNeeds,
      primaryLanguage,
    } = req.body;

    const child = await LeadsService.addChild(req.params.id, {
      fullName,
      dateOfBirth,
      gender,
      nationality,
      desiredGrade,
      currentSchool,
      specialNeeds,
      primaryLanguage,
    });

    res.status(201).json({ success: true, data: child });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Add child error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateChild(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateChildSchema.parse(req.body);
    const updated = await LeadsService.updateChild(
      req.params.childId,
      req.params.id,
      data,
      req.user!.id,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'CHILD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Criança não encontrada' });
    }
    logger.error('Update child error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteChild(req: AuthenticatedRequest, res: Response) {
  try {
    await LeadsService.deleteChild(req.params.childId, req.params.id, req.user!.id);
    res.json({ success: true, message: 'Criança removida com sucesso' });
  } catch (error) {
    if (error instanceof Error && error.message === 'CHILD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Criança não encontrada' });
    }
    logger.error('Delete child error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateParent(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateParentSchema.parse(req.body);
    const updateData: any = { ...data };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }
    const updated = await LeadsService.updateParent(
      req.params.parentId,
      req.params.id,
      updateData,
      req.user!.id,
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'PARENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Responsável não encontrado' });
    }
    logger.error('Update parent error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateAddress(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateAddressSchema.parse(req.body);
    const updated = await LeadsService.updateAddress(req.params.id, data, req.user!.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update address error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateChildHealth(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateChildHealthSchema.parse(req.body);
    const updated = await LeadsService.updateChildHealth(
      req.params.childId,
      req.params.id,
      data,
      req.user!.id,
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update child health error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateChildTransport(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateChildTransportSchema.parse(req.body);
    const updated = await LeadsService.updateChildTransport(
      req.params.childId,
      req.params.id,
      data,
      req.user!.id,
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update child transport error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createEmergencyContactSchema.parse(req.body);
    const created = await LeadsService.createEmergencyContact(req.params.id, data, req.user!.id);
    res.json({ success: true, data: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create emergency contact error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateEmergencyContactSchema.parse(req.body);
    const updated = await LeadsService.updateEmergencyContact(
      req.params.contactId,
      req.params.id,
      data,
      req.user!.id,
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update emergency contact error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    await LeadsService.deleteEmergencyContact(req.params.contactId, req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Delete emergency contact error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateFinancialResponsible(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateFinancialResponsibleSchema.parse(req.body);
    const updated = await LeadsService.updateFinancialResponsible(req.params.id, data, req.user!.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update financial responsible error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateHealthPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateHealthPlanSchema.parse(req.body);
    const updated = await LeadsService.updateHealthPlan(req.params.id, data, req.user!.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update health plan error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
