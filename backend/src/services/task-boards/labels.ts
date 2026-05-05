import { prisma } from '../../config/database.js';

export async function listLabels(boardId: string) {
  return prisma.taskLabel.findMany({
    where: { boardId },
  });
}

export async function createLabel(
  boardId: string,
  data: { name: string; color: string },
) {
  return prisma.taskLabel.create({
    data: {
      boardId,
      name: data.name,
      color: data.color,
    },
  });
}

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
) {
  return prisma.taskLabel.update({
    where: { id: labelId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
}

export async function deleteLabel(labelId: string) {
  await prisma.taskLabel.delete({
    where: { id: labelId },
  });
}
