import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

export async function listBoardMembers(boardId: string) {
  return prisma.taskBoardMember.findMany({
    where: { boardId },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });
}

export async function addBoardMember(boardId: string, userId: string) {
  return prisma.taskBoardMember.upsert({
    where: {
      boardId_userId: { boardId, userId },
    },
    create: { boardId, userId },
    update: {},
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
}

export async function removeBoardMember(boardId: string, userId: string) {
  const board = await prisma.taskBoard.findUnique({
    where: { id: boardId },
    select: { createdById: true },
  });

  if (!board) {
    throw new AppError(404, 'Quadro não encontrado', 'BOARD_NOT_FOUND');
  }

  if (board.createdById === userId) {
    throw new AppError(
      400,
      'Não é possível remover o criador do quadro',
      'CANNOT_REMOVE_CREATOR',
    );
  }

  await prisma.taskBoardMember.deleteMany({
    where: { boardId, userId },
  });
}
