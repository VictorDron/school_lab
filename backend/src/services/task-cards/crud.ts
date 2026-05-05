import { TaskPriority } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { generateTaskCode, postTaskUpdateToChannel } from '../task-boards.service.js';
import { CARD_LIST_INCLUDE } from './shared.js';

/**
 * Paginated card list with filters. Supports overdue/this_week/no_date
 * date filters in addition to the explicit status, assignee, and label
 * filters. The "overdue" preset overrides the explicit status filter so
 * users searching for overdue cards never see COMPLETED ones.
 */
export async function getCards(
  boardId: string,
  filters: {
    page: number;
    limit: number;
    skip: number;
    status?: string;
    assigneeId?: string;
    labelId?: string;
    dueDateFilter?: string;
    search?: string;
  },
) {
  const { page, limit, skip, status, assigneeId, labelId, dueDateFilter, search } = filters;

  const where: any = {
    column: { boardId },
  };

  if (status) {
    where.status = status;
  }

  if (assigneeId) {
    where.assignees = { some: { userId: assigneeId } };
  }

  if (labelId) {
    where.labels = { some: { labelId } };
  }

  if (dueDateFilter === 'overdue') {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'COMPLETED' };
  } else if (dueDateFilter === 'this_week') {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);
    where.dueDate = { gte: now, lte: endOfWeek };
  } else if (dueDateFilter === 'no_date') {
    where.dueDate = null;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [cards, total] = await Promise.all([
    prisma.taskCard.findMany({
      where,
      include: {
        ...CARD_LIST_INCLUDE,
        _count: { select: { comments: true, checklists: true } },
      },
      orderBy: { order: 'asc' },
      skip,
      take: limit,
    }),
    prisma.taskCard.count({ where }),
  ]);

  return {
    cards,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCard(cardId: string) {
  const card = await prisma.taskCard.findUnique({
    where: { id: cardId },
    include: {
      assignees: {
        include: {
          user: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
        },
      },
      labels: { include: { label: true } },
      checklists: {
        include: { items: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
      comments: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      activity: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      column: {
        include: { board: { select: { id: true, name: true } } },
      },
    },
  });

  return card;
}

/**
 * Append a card to the end of a column. Computing the next order via
 * `_max.order + 1` keeps existing siblings untouched — `moveCard` is the
 * only function that rewrites positions.
 */
export async function createCard(
  data: {
    columnId: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | Date;
  },
  userId: string,
  userDisplayName: string,
) {
  const maxOrder = await prisma.taskCard.aggregate({
    where: { columnId: data.columnId },
    _max: { order: true },
  });

  const order = (maxOrder._max.order ?? -1) + 1;

  const card = await prisma.taskCard.create({
    data: {
      code: generateTaskCode(),
      columnId: data.columnId,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      order,
      createdById: userId,
    },
    include: CARD_LIST_INCLUDE,
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'CREATED',
      actorId: userId,
    },
  });

  await postTaskUpdateToChannel(
    card.column.boardId,
    'created',
    card.title,
    userDisplayName,
  );

  return { card, boardId: card.column.boardId };
}

export async function updateCard(
  cardId: string,
  data: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string | Date | null;
    coverImage?: string | null;
  },
  userId: string,
) {
  const existingCard = await prisma.taskCard.findUnique({
    where: { id: cardId },
  });

  if (!existingCard) {
    throw new AppError(404, 'Card não encontrado', 'CARD_NOT_FOUND');
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;

  const card = await prisma.taskCard.update({
    where: { id: cardId },
    data: updateData,
    include: CARD_LIST_INCLUDE,
  });

  await prisma.taskActivity.create({
    data: {
      cardId: card.id,
      action: 'UPDATED',
      actorId: userId,
      details: { changes: Object.keys(data) },
    },
  });

  return { card, boardId: card.column.boardId, changes: Object.keys(data) };
}
