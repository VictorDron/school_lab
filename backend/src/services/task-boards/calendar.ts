import { prisma } from '../../config/database.js';

export async function getCardsForCalendar(
  userId: string,
  startDate: Date,
  endDate: Date,
) {
  return prisma.taskCard.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      dueDate: { gte: startDate, lte: endDate },
      assignees: { some: { userId } },
    },
    include: {
      column: {
        include: { board: { select: { id: true, name: true } } },
      },
      assignees: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
      labels: {
        include: { label: true },
      },
    },
    orderBy: { dueDate: 'asc' },
  });
}
