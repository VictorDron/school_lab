import { Response } from 'express';
import { z } from 'zod';
import { createAuditLog } from '../services/audit.service.js';
import * as TaskCardsService from '../services/task-cards.service.js';
import { getIO } from '../socket/io.js';
import { AuthenticatedRequest } from '../types/index.js';
import logger from '../utils/logger.js';
import { getPaginationParams } from '../utils/helpers.js';
import { AppError } from '../middlewares/errorHandler.js';

// ==================== Validation Schemas ====================

const createCardSchema = z.object({
  columnId: z.string(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().or(z.date()).optional(),
});

const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().or(z.date()).nullable().optional(),
  coverImage: z.string().nullable().optional(),
});

const moveCardSchema = z.object({
  columnId: z.string(),
  order: z.number(),
});

const assignUserSchema = z.object({
  userId: z.string(),
});

const addLabelSchema = z.object({
  labelId: z.string(),
});

const createChecklistSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
});

const updateChecklistSchema = z.object({
  title: z.string().min(1).optional(),
});

const addChecklistItemSchema = z.object({
  text: z.string().min(1, 'Texto é obrigatório'),
});

const addCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  attachments: z.any().optional(),
});

// ==================== Helper ====================

function emitToBoardRoom(boardId: string, event: string, data: any) {
  try {
    const io = getIO();
    io.to(`board:${boardId}`).emit(event, data);
  } catch {
    // Socket.IO not initialized, ignore
  }
}

function handleError(error: unknown, res: Response, context: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: error.errors,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code,
    });
  }

  logger.error(`${context} error:`, error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
  });
}

// ==================== Cards ====================

export async function getCards(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query);
    const { assigneeId, labelId, dueDateFilter, search, status } = req.query;

    const result = await TaskCardsService.getCards(boardId, {
      page,
      limit,
      skip,
      status: status as string | undefined,
      assigneeId: assigneeId as string | undefined,
      labelId: labelId as string | undefined,
      dueDateFilter: dueDateFilter as string | undefined,
      search: search as string | undefined,
    });

    res.json({ success: true, data: result.cards, meta: result.meta });
  } catch (error) {
    handleError(error, res, 'Get cards');
  }
}

export async function getCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;

    const card = await TaskCardsService.getCard(cardId);

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card não encontrado',
      });
    }

    res.json({ success: true, data: card });
  } catch (error) {
    handleError(error, res, 'Get card');
  }
}

export async function createCard(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createCardSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await TaskCardsService.createCard(data, userId, req.user!.displayName);

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'TASK_CARD_CREATED',
      entityType: 'TASK_CARD',
      entityId: result.card.id,
      metadata: { code: result.card.code, title: result.card.title },
    }, req);

    emitToBoardRoom(result.boardId, 'task:created', result.card);

    res.status(201).json({ success: true, data: result.card });
  } catch (error) {
    handleError(error, res, 'Create card');
  }
}

export async function updateCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const data = updateCardSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await TaskCardsService.updateCard(cardId, data, userId);

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'TASK_CARD_UPDATED',
      entityType: 'TASK_CARD',
      entityId: result.card.id,
      metadata: { changes: result.changes },
    }, req);

    emitToBoardRoom(result.boardId, 'task:updated', result.card);

    res.json({ success: true, data: result.card });
  } catch (error) {
    handleError(error, res, 'Update card');
  }
}

export async function moveCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const { columnId, order } = moveCardSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await TaskCardsService.moveCard(
      cardId, columnId, order, userId, req.user!.displayName
    );

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'TASK_CARD_MOVED',
      entityType: 'TASK_CARD',
      entityId: result.card.id,
      metadata: { fromColumn: result.fromColumn, toColumn: result.toColumn },
    }, req);

    emitToBoardRoom(result.boardId, 'task:moved', result.card);

    res.json({ success: true, data: result.card });
  } catch (error) {
    handleError(error, res, 'Move card');
  }
}

// ==================== Assignments ====================

export async function assignUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const { userId } = assignUserSchema.parse(req.body);

    const result = await TaskCardsService.assignUser(cardId, userId, req.user!.id);

    emitToBoardRoom(result.boardId, 'task:assigned', {
      cardId,
      assignment: result.assignment,
    });

    res.status(201).json({ success: true, data: result.assignment });
  } catch (error) {
    handleError(error, res, 'Assign user');
  }
}

export async function unassignUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId, userId } = req.params;

    const result = await TaskCardsService.unassignUser(cardId, userId, req.user!.id);

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(error, res, 'Unassign user');
  }
}

// ==================== Labels ====================

export async function addLabel(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const { labelId } = addLabelSchema.parse(req.body);

    const cardLabel = await TaskCardsService.addLabel(cardId, labelId);

    res.status(201).json({ success: true, data: cardLabel });
  } catch (error) {
    handleError(error, res, 'Add label');
  }
}

export async function removeLabel(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId, labelId } = req.params;

    await TaskCardsService.removeLabel(cardId, labelId);

    res.json({ success: true, data: { cardId, labelId } });
  } catch (error) {
    handleError(error, res, 'Remove label');
  }
}

// ==================== Card Status ====================

export async function completeCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const userId = req.user!.id;

    const result = await TaskCardsService.completeCard(
      cardId, userId, req.user!.displayName
    );

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'TASK_CARD_COMPLETED',
      entityType: 'TASK_CARD',
      entityId: result.card.id,
      metadata: { title: result.card.title },
    }, req);

    emitToBoardRoom(result.boardId, 'task:completed', result.card);

    res.json({ success: true, data: result.card });
  } catch (error) {
    handleError(error, res, 'Complete card');
  }
}

export async function reopenCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;

    const card = await TaskCardsService.reopenCard(cardId, req.user!.id);

    res.json({ success: true, data: card });
  } catch (error) {
    handleError(error, res, 'Reopen card');
  }
}

export async function archiveCard(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;

    const card = await TaskCardsService.archiveCard(cardId, req.user!.id);

    res.json({ success: true, data: card });
  } catch (error) {
    handleError(error, res, 'Archive card');
  }
}

// ==================== Checklists ====================

export async function createChecklist(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const data = createChecklistSchema.parse(req.body);

    const checklist = await TaskCardsService.createChecklist(cardId, data.title);

    res.status(201).json({ success: true, data: checklist });
  } catch (error) {
    handleError(error, res, 'Create checklist');
  }
}

export async function updateChecklist(req: AuthenticatedRequest, res: Response) {
  try {
    const { checklistId } = req.params;
    const data = updateChecklistSchema.parse(req.body);

    const checklist = await TaskCardsService.updateChecklist(checklistId, data);

    res.json({ success: true, data: checklist });
  } catch (error) {
    handleError(error, res, 'Update checklist');
  }
}

export async function deleteChecklist(req: AuthenticatedRequest, res: Response) {
  try {
    const { checklistId } = req.params;

    await TaskCardsService.deleteChecklist(checklistId);

    res.json({ success: true, data: { id: checklistId } });
  } catch (error) {
    handleError(error, res, 'Delete checklist');
  }
}

export async function addChecklistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { checklistId } = req.params;
    const data = addChecklistItemSchema.parse(req.body);

    const item = await TaskCardsService.addChecklistItem(checklistId, data.text);

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    handleError(error, res, 'Add checklist item');
  }
}

export async function toggleChecklistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { itemId } = req.params;

    const result = await TaskCardsService.toggleChecklistItem(itemId);

    if (result.boardId) {
      emitToBoardRoom(result.boardId, 'checklist:updated', {
        cardId: result.cardId,
        item: result.item,
      });
    }

    res.json({ success: true, data: result.item });
  } catch (error) {
    handleError(error, res, 'Toggle checklist item');
  }
}

export async function deleteChecklistItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { itemId } = req.params;

    await TaskCardsService.deleteChecklistItem(itemId);

    res.json({ success: true, data: { id: itemId } });
  } catch (error) {
    handleError(error, res, 'Delete checklist item');
  }
}

// ==================== Comments ====================

export async function getComments(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const { page, limit, skip } = getPaginationParams(req.query);

    const result = await TaskCardsService.getComments(cardId, { page, limit, skip });

    res.json({ success: true, data: result.comments, meta: result.meta });
  } catch (error) {
    handleError(error, res, 'Get comments');
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { cardId } = req.params;
    const data = addCommentSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await TaskCardsService.addComment(
      cardId, userId, data.content, data.attachments
    );

    emitToBoardRoom(result.boardId, 'task:comment', {
      cardId,
      comment: result.comment,
    });

    res.status(201).json({ success: true, data: result.comment });
  } catch (error) {
    handleError(error, res, 'Add comment');
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Conteúdo do comentário é obrigatório',
      });
    }

    const updatedComment = await TaskCardsService.updateComment(
      commentId, req.user!.id, content
    );

    res.json({ success: true, data: updatedComment });
  } catch (error) {
    handleError(error, res, 'Update comment');
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { commentId } = req.params;

    await TaskCardsService.deleteComment(commentId, req.user!.id, req.user!.role);

    res.json({ success: true, data: { id: commentId } });
  } catch (error) {
    handleError(error, res, 'Delete comment');
  }
}
