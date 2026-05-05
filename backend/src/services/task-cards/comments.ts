import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { createNotification } from '../notification.service.js';

export async function getComments(
  cardId: string,
  pagination: { page: number; limit: number; skip: number },
) {
  const { page, limit, skip } = pagination;

  const [comments, total] = await Promise.all([
    prisma.taskComment.findMany({
      where: { cardId },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.taskComment.count({ where: { cardId } }),
  ]);

  return {
    comments,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Adds a comment and notifies every assignee except the commenter — this
 * is intentionally a fan-out, not a single notification per card. If the
 * commenter is the only assignee no notifications are created.
 */
export async function addComment(
  cardId: string,
  userId: string,
  content: string,
  attachments?: any,
) {
  const card = await prisma.taskCard.findUnique({
    where: { id: cardId },
    include: {
      assignees: { select: { userId: true } },
      column: { select: { boardId: true } },
    },
  });

  if (!card) {
    throw new AppError(404, 'Card não encontrado', 'CARD_NOT_FOUND');
  }

  const comment = await prisma.taskComment.create({
    data: {
      cardId,
      userId,
      content,
      attachments,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  const usersToNotify = card.assignees
    .map((a) => a.userId)
    .filter((uid) => uid !== userId);

  for (const notifyUserId of usersToNotify) {
    await createNotification({
      userId: notifyUserId,
      type: 'task_comment',
      title: 'Novo Comentário',
      message: `Novo comentário na tarefa "${card.title}"`,
      data: {
        cardId: card.id,
        cardCode: card.code,
        actionUrl: `/tasks?card=${card.id}`,
      },
    });
  }

  await prisma.taskActivity.create({
    data: {
      cardId,
      action: 'COMMENTED',
      actorId: userId,
      details: { commentId: comment.id },
    },
  });

  return { comment, boardId: card.column.boardId };
}

export async function updateComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(404, 'Comentário não encontrado', 'COMMENT_NOT_FOUND');
  }

  if (comment.userId !== userId) {
    throw new AppError(403, 'Você não tem permissão para editar este comentário', 'COMMENT_FORBIDDEN');
  }

  return prisma.taskComment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

/**
 * Authors can delete their own comments; ADMINs can delete any. Hard delete
 * — no soft-delete column on TaskComment.
 */
export async function deleteComment(commentId: string, userId: string, userRole: string) {
  const comment = await prisma.taskComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new AppError(404, 'Comentário não encontrado', 'COMMENT_NOT_FOUND');
  }

  if (comment.userId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'Você não tem permissão para excluir este comentário', 'COMMENT_FORBIDDEN');
  }

  await prisma.taskComment.delete({
    where: { id: commentId },
  });
}
