import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as KanbanColumnsService from '../services/kanban-columns.service.js';
import logger from '../utils/logger.js';

// Validation schemas
const createColumnSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  isFinal: z.boolean().default(false),
});

const updateColumnSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isFinal: z.boolean().optional(),
});

const reorderSchema = z.object({
  columns: z.array(z.object({
    id: z.string(),
    order: z.number().min(0),
  })),
});

const deleteColumnSchema = z.object({
  targetColumnId: z.string().optional(),
});

/**
 * List all kanban columns
 */
export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const columns = await KanbanColumnsService.findAll();
    res.json({ success: true, data: columns });
  } catch (error) {
    logger.error('Get kanban columns error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Get a single kanban column
 */
export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const column = await KanbanColumnsService.findById(req.params.id);

    if (!column) {
      return res.status(404).json({ success: false, error: 'Coluna não encontrada' });
    }

    res.json({ success: true, data: column });
  } catch (error) {
    logger.error('Get kanban column error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Create a new kanban column
 */
export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createColumnSchema.parse(req.body);
    const column = await KanbanColumnsService.create(data);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'KANBAN_COLUMN_CREATED',
      entityType: 'KANBAN_COLUMN',
      entityId: column.id,
      metadata: { name: column.name, slug: column.slug },
    }, req);

    res.status(201).json({ success: true, data: column });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create kanban column error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Update a kanban column
 */
export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateColumnSchema.parse(req.body);
    const column = await KanbanColumnsService.update(req.params.id, data);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'KANBAN_COLUMN_UPDATED',
      entityType: 'KANBAN_COLUMN',
      entityId: column.id,
      metadata: { name: column.name, changes: Object.keys(data) },
    }, req);

    res.json({ success: true, data: column });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'COLUMN_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Coluna não encontrada' });
    }
    logger.error('Update kanban column error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Reorder kanban columns
 */
export async function reorder(req: AuthenticatedRequest, res: Response) {
  try {
    const { columns } = reorderSchema.parse(req.body);
    const updatedColumns = await KanbanColumnsService.reorder(columns);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'KANBAN_COLUMN_REORDERED',
      entityType: 'KANBAN_COLUMN',
      entityId: undefined,
      metadata: { newOrder: columns.map(c => ({ id: c.id, order: c.order })) },
    }, req);

    res.json({ success: true, data: updatedColumns });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'COLUMNS_NOT_FOUND') {
      return res.status(400).json({ success: false, error: 'Uma ou mais colunas não foram encontradas' });
    }
    logger.error('Reorder kanban columns error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Delete a kanban column
 */
export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const { targetColumnId } = deleteColumnSchema.parse(req.body || {});
    const { column, leadsMigrated } = await KanbanColumnsService.remove(req.params.id, targetColumnId);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'KANBAN_COLUMN_DELETED',
      entityType: 'KANBAN_COLUMN',
      entityId: column.id,
      metadata: { name: column.name, leadsMigrated, targetColumnId },
    }, req);

    res.json({ success: true, message: 'Coluna excluída com sucesso' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error) {
      switch (error.message) {
        case 'COLUMN_NOT_FOUND':
          return res.status(404).json({ success: false, error: 'Coluna não encontrada' });
        case 'CANNOT_DELETE_DEFAULT':
          return res.status(400).json({ success: false, error: 'Colunas padrão não podem ser excluídas' });
        case 'REQUIRES_TARGET_COLUMN':
          return res.status(400).json({
            success: false,
            error: 'Esta coluna possui leads. Informe targetColumnId para migrar os leads.',
          });
        case 'TARGET_COLUMN_NOT_FOUND':
          return res.status(400).json({ success: false, error: 'Coluna de destino não encontrada' });
        case 'CANNOT_MIGRATE_TO_SELF':
          return res.status(400).json({ success: false, error: 'Não é possível migrar para a mesma coluna' });
      }
    }
    logger.error('Delete kanban column error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
