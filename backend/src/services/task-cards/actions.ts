import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { createNotification } from '../notification.service.js';
import { postTaskUpdateToChannel } from '../task-boards.service.js';
import { CARD_LIST_INCLUDE } from './shared.js';

/**
 * Move a card between columns or within a column. Wrapped in a single
 * transaction so the make-room shift in the target column and the close-
 * gap shift in the source column never see each other half-applied. The
 * intra-column case skips the second updateMany — a single transaction
 * with two passes would briefly violate the unique (columnId, order)
 * constraint if it exists.
 */
export async function moveCard(
  cardId: string,
  targetColumnId: string,
  targetOrder: number,
  userId: string,
  userDisplayName: string,
) {
  const existingCard = await prisma.taskCard.findUnique({
    where: { id: cardId },
    include: { column: { select: { id: true, name: true, boardId: true } } },
  });

  if (!existingCard) {
    throw new AppError(404, 'Card não encontrado', 'CARD_NOT_FOUND');
  }

  const targetColumn = await prisma.taskColumn.findUnique({
    where: { id: targetColumnId },
    select: { id: true, name: true, boardId: true },
  });

  if (!targetColumn) {
    throw new AppError(404, 'Coluna de destino não encontrada', 'COLUMN_NOT_FOUND');
  }

  const fromColumnId = existingCard.columnId;
  const fromColumnName = existingCard.column.name;
  const toColumnName = targetColumn.name;

  const card = await prisma.$transaction(async (tx) => {
    await tx.taskCard.updateMany({
      where: {
        columnId: targetColumnId,
        order: { gte: targetOrder },
        id: { not: cardId },
      },
      data: { order: { increment: 1 } },
    });

    if (fromColumnId === targetColumnId) {
      await tx.taskCard.updateMany({
        where: {
          columnId: fromColumnId,
          order: { gt: existingCard.order },
          id: { not: cardId },
        },
        data: { order: { decrement: 1 } },
      });
    } else {
      await tx.taskCard.updateMany({
        where: {
          columnId: fromColumnId,
          order: { gt: existingCard.order },
        },
        data: { order: { decrement: 1 } },
      });
    }

    return tx.taskCard.update({
      where: { id: cardId },
      data: { columnId: targetColumnId, order: targetOrder },
      include: CARD_LIST_INCLUDE,
    });
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'MOVED',
      actorId: userId,
      details: { fromColumn: fromColumnName, toColumn: toColumnName },
    },
  });

  await postTaskUpdateToChannel(
    card.column.boardId,
    'moved',
    card.title,
    userDisplayName,
  );

  return {
    card,
    boardId: card.column.boardId,
    fromColumn: fromColumnName,
    toColumn: toColumnName,
  };
}

/**
 * Assign a user to a card. Self-assignment skips the notification — the
 * actor is already aware of what they did.
 */
export async function assignUser(cardId: string, targetUserId: string, actorId: string) {
  const card = await prisma.taskCard.findUnique({
    where: { id: cardId },
    include: { column: { select: { boardId: true } } },
  });

  if (!card) {
    throw new AppError(404, 'Card não encontrado', 'CARD_NOT_FOUND');
  }

  const assignment = await prisma.taskAssignment.create({
    data: { cardId, userId: targetUserId },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  if (targetUserId !== actorId) {
    await createNotification({
      userId: targetUserId,
      type: 'task_assigned',
      title: 'Tarefa Atribuída',
      message: `Você foi atribuído à tarefa "${card.title}"`,
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
      action: 'ASSIGNED',
      actorId,
      details: { userId: targetUserId },
    },
  });

  return { assignment, boardId: card.column.boardId };
}

export async function unassignUser(cardId: string, targetUserId: string, actorId: string) {
  await prisma.taskAssignment.delete({
    where: { cardId_userId: { cardId, userId: targetUserId } },
  });

  await prisma.taskActivity.create({
    data: {
      cardId,
      action: 'UNASSIGNED',
      actorId,
      details: { userId: targetUserId },
    },
  });

  return { cardId, userId: targetUserId };
}

export async function addLabel(cardId: string, labelId: string) {
  return prisma.taskCardLabel.create({
    data: { cardId, labelId },
    include: { label: true },
  });
}

export async function removeLabel(cardId: string, labelId: string) {
  await prisma.taskCardLabel.delete({
    where: { cardId_labelId: { cardId, labelId } },
  });
}

export async function completeCard(cardId: string, userId: string, userDisplayName: string) {
  const card = await prisma.taskCard.update({
    where: { id: cardId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
    include: { column: { select: { boardId: true } } },
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'COMPLETED',
      actorId: userId,
    },
  });

  await postTaskUpdateToChannel(
    card.column.boardId,
    'completed',
    card.title,
    userDisplayName,
  );

  return { card, boardId: card.column.boardId };
}

export async function reopenCard(cardId: string, userId: string) {
  const card = await prisma.taskCard.update({
    where: { id: cardId },
    data: {
      status: 'OPEN',
      completedAt: null,
    },
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'REOPENED',
      actorId: userId,
    },
  });

  return card;
}

export async function archiveCard(cardId: string, userId: string) {
  const card = await prisma.taskCard.update({
    where: { id: cardId },
    data: { status: 'ARCHIVED' },
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'ARCHIVED',
      actorId: userId,
    },
  });

  return card;
}
