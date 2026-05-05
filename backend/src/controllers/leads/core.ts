import { LeadSource } from '@prisma/client';
import type { Response } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../../services/audit.service.js';
import * as LeadsService from '../../services/leads/index.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import { getPaginationParams } from '../../utils/helpers.js';
import logger from '../../utils/logger.js';
import { createLeadSchema, updateLeadSchema } from './schemas.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { columnId, source, flagged, search } = req.query;

    const filters: LeadsService.LeadFilters = {
      columnId: columnId as string | undefined,
      source: source as LeadSource | undefined,
      flagged: flagged === 'true',
      search: search as string | undefined,
    };

    const { leads, total } = await LeadsService.findMany(filters, { page, limit, skip });

    res.json({
      success: true,
      data: leads,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Get leads error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const lead = await LeadsService.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Get lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createLeadSchema.parse(req.body);
    const lead = await LeadsService.create(data, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_CREATED',
        entityType: 'LEAD',
        entityId: lead.id,
        metadata: { code: lead.code, familyName: lead.familyName },
      },
      req,
    );

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'LEAD_DUPLICATE_EMAIL') {
      return res.status(409).json({
        success: false,
        error: 'LEAD_DUPLICATE_EMAIL',
        message: 'Já existe um lead com este e-mail.',
        duplicates: (error as any).duplicates || [],
      });
    }
    if (error instanceof Error && error.message === 'NO_COLUMN_FOUND') {
      return res.status(500).json({ success: false, error: 'Nenhuma coluna do kanban encontrada' });
    }
    logger.error('Create lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateLeadSchema.parse(req.body);
    const updated = await LeadsService.update(req.params.id, data, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: updated.id,
        metadata: { changes: Object.keys(data) },
      },
      req,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Update lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const lead = await LeadsService.remove(req.params.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_DELETED',
        entityType: 'LEAD',
        entityId: lead.id,
        metadata: { code: lead.code, familyName: lead.familyName },
      },
      req,
    );

    res.json({ success: true, message: 'Lead deletado com sucesso' });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Delete lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Move a lead to a different kanban column. Audit log captures both
 * old and new columns by id+name so the timeline view can render
 * "moved from X to Y" without joining back to the column table.
 */
export async function updateColumn(req: AuthenticatedRequest, res: Response) {
  try {
    const { columnId } = req.body;

    if (!columnId) {
      return res.status(400).json({ success: false, error: 'columnId é obrigatório' });
    }

    const { updated, previousColumn, targetColumn } = await LeadsService.updateColumn(
      req.params.id,
      columnId,
      req.user!.id,
    );

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_STATUS_CHANGED',
        entityType: 'LEAD',
        entityId: updated.id,
        metadata: {
          previousColumnId: previousColumn.id,
          previousColumnName: previousColumn.name,
          newColumnId: targetColumn.id,
          newColumnName: targetColumn.name,
        },
      },
      req,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'COLUMN_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Coluna não encontrada' });
      }
    }
    logger.error('Update lead column error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function toggleFlag(req: AuthenticatedRequest, res: Response) {
  try {
    const updated = await LeadsService.toggleFlag(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Toggle flag error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
