import { prisma } from '../../config/database.js';

export async function listColumns(boardId: string) {
  return prisma.taskColumn.findMany({
    where: { boardId },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { cards: true },
      },
    },
  });
}

export async function createColumn(
  boardId: string,
  data: { name: string; color?: string },
) {
  const maxOrderColumn = await prisma.taskColumn.findFirst({
    where: { boardId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const order = (maxOrderColumn?.order ?? -1) + 1;

  return prisma.taskColumn.create({
    data: {
      boardId,
      name: data.name,
      color: data.color ?? '#6B7280',
      order,
    },
  });
}

export async function updateColumn(
  columnId: string,
  data: { name?: string; color?: string; limit?: number | null },
) {
  return prisma.taskColumn.update({
    where: { id: columnId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.limit !== undefined && { limit: data.limit }),
    },
  });
}

export async function deleteColumn(boardId: string, columnId: string) {
  const cardCount = await prisma.taskCard.count({
    where: { columnId },
  });

  if (cardCount > 0) {
    const firstColumn = await prisma.taskColumn.findFirst({
      where: { boardId, id: { not: columnId } },
      orderBy: { order: 'asc' },
    });

    if (firstColumn) {
      await prisma.taskCard.updateMany({
        where: { columnId },
        data: { columnId: firstColumn.id },
      });
    }
  }

  await prisma.taskColumn.delete({
    where: { id: columnId },
  });
}

export async function reorderColumns(
  columns: Array<{ id: string; order: number }>,
) {
  await prisma.$transaction(
    columns.map((col) =>
      prisma.taskColumn.update({
        where: { id: col.id },
        data: { order: col.order },
      }),
    ),
  );
}
