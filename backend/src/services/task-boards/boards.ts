import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { createDefaultColumns } from './helpers.js';

export async function listBoards(userId: string) {
  return prisma.taskBoard.findMany({
    where: {
      isArchived: false,
      OR: [
        { visibility: 'PUBLIC' },
        { members: { some: { userId } } },
        { createdById: userId },
        { channel: { members: { some: { userId } } } },
      ],
    },
    include: {
      _count: {
        select: { columns: true, members: true },
      },
      channel: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getBoard(boardId: string) {
  const board = await prisma.taskBoard.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          cards: {
            orderBy: { order: 'asc' },
            include: {
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
              _count: {
                select: { comments: true, checklists: true },
              },
            },
          },
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      },
      labels: true,
      channel: {
        select: { id: true, name: true },
      },
    },
  });

  if (!board) {
    throw new AppError(404, 'Quadro não encontrado', 'BOARD_NOT_FOUND');
  }

  return board;
}

export async function createBoard(
  userId: string,
  data: {
    name: string;
    description?: string;
    channelId?: string;
    visibility: string;
  },
) {
  if (data.visibility === 'CHANNEL') {
    const channel = await prisma.channel.findFirst({
      where: {
        id: data.channelId,
        OR: [{ type: 'PUBLIC' }, { members: { some: { userId } } }],
      },
      select: { id: true },
    });

    if (!channel) {
      throw new AppError(
        403,
        'Você não tem acesso ao canal selecionado',
        'CHANNEL_ACCESS_DENIED',
      );
    }
  }

  const board = await prisma.taskBoard.create({
    data: {
      name: data.name,
      description: data.description,
      channelId: data.visibility === 'CHANNEL' ? data.channelId : undefined,
      visibility: data.visibility as any,
      createdById: userId,
      members: {
        create: [{ userId, isAdmin: true }],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  await createDefaultColumns(board.id);

  return board;
}

export async function updateBoard(
  boardId: string,
  data: { name?: string; description?: string; visibility?: string },
) {
  return prisma.taskBoard.update({
    where: { id: boardId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.visibility && { visibility: data.visibility as any }),
    },
  });
}

export async function archiveBoard(boardId: string) {
  return prisma.taskBoard.update({
    where: { id: boardId },
    data: { isArchived: true },
  });
}
