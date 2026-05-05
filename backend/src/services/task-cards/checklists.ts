import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { getBoardIdFromCard } from './shared.js';

export async function createChecklist(cardId: string, title: string) {
  const maxOrder = await prisma.taskChecklist.aggregate({
    where: { cardId },
    _max: { order: true },
  });

  const order = (maxOrder._max.order ?? -1) + 1;

  return prisma.taskChecklist.create({
    data: { cardId, title, order },
    include: { items: { orderBy: { order: 'asc' } } },
  });
}

export async function updateChecklist(checklistId: string, data: { title?: string }) {
  return prisma.taskChecklist.update({
    where: { id: checklistId },
    data,
    include: { items: { orderBy: { order: 'asc' } } },
  });
}

export async function deleteChecklist(checklistId: string) {
  await prisma.taskChecklist.delete({
    where: { id: checklistId },
  });
}

export async function addChecklistItem(checklistId: string, text: string) {
  const maxOrder = await prisma.taskChecklistItem.aggregate({
    where: { checklistId },
    _max: { order: true },
  });

  const order = (maxOrder._max.order ?? -1) + 1;

  return prisma.taskChecklistItem.create({
    data: { checklistId, text, order },
  });
}

/**
 * Toggle returns the resolved boardId because the controller broadcasts
 * the change to that board's room — looking it up here saves the caller a
 * round-trip and keeps the realtime layer dumb.
 */
export async function toggleChecklistItem(itemId: string) {
  const existing = await prisma.taskChecklistItem.findUnique({
    where: { id: itemId },
    include: { checklist: { select: { cardId: true } } },
  });

  if (!existing) {
    throw new AppError(404, 'Item não encontrado', 'CHECKLIST_ITEM_NOT_FOUND');
  }

  const newIsComplete = !existing.isComplete;

  const item = await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: {
      isComplete: newIsComplete,
      completedAt: newIsComplete ? new Date() : null,
    },
  });

  const boardId = await getBoardIdFromCard(existing.checklist.cardId);

  return { item, cardId: existing.checklist.cardId, boardId };
}

export async function deleteChecklistItem(itemId: string) {
  await prisma.taskChecklistItem.delete({
    where: { id: itemId },
  });
}
