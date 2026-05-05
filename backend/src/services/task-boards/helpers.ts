import { prisma } from '../../config/database.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';

export async function createDefaultColumns(boardId: string) {
  const columns = [
    { boardId, name: 'A Fazer', color: '#6B7280', order: 0 },
    { boardId, name: 'Em Progresso', color: '#3B82F6', order: 1 },
    { boardId, name: 'Concluído', color: '#10B981', order: 2 },
  ];

  await prisma.taskColumn.createMany({ data: columns });
}

export async function checkBoardAccess(
  userId: string,
  boardId: string,
  requireAdmin = false,
): Promise<boolean> {
  const board = await prisma.taskBoard.findUnique({
    where: { id: boardId },
    include: {
      members: { where: { userId } },
      channel: {
        include: { members: { where: { userId } } },
      },
    },
  });

  if (!board || board.isArchived) return false;

  if (board.createdById === userId) return true;

  if (board.visibility === 'PUBLIC' && !requireAdmin) return true;

  if (board.visibility === 'CHANNEL' && board.channel) {
    if (board.channel.members.length > 0) {
      if (requireAdmin) {
        return board.members.some((m) => m.isAdmin);
      }
      return true;
    }
  }

  const member = board.members[0];
  if (!member) return false;
  if (requireAdmin) return member.isAdmin;
  return true;
}

export async function postTaskUpdateToChannel(
  boardId: string,
  action: string,
  cardTitle: string,
  actorName: string,
) {
  try {
    const board = await prisma.taskBoard.findUnique({
      where: { id: boardId },
      select: { tenantId: true, channelId: true },
    });

    if (!board?.channelId) return;

    const actionMessages: Record<string, string> = {
      created: `criou a tarefa "${cardTitle}"`,
      completed: `completou a tarefa "${cardTitle}"`,
      moved: `moveu a tarefa "${cardTitle}"`,
    };

    const messageContent = `📋 ${actorName} ${actionMessages[action] || `atualizou "${cardTitle}"`}`;

    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (!systemUser) return;

    await prisma.message.create({
      data: {
        tenantId: board.tenantId,
        channelId: board.channelId,
        senderId: systemUser.id,
        content: messageContent,
        messageType: 'TASK_REF',
        metadata: { boardId, action, cardTitle },
      },
    });

    try {
      const io = getIO();
      io.to(`channel:${board.channelId}`).emit('message:new', {
        content: messageContent,
        messageType: 'TASK_REF',
      });
    } catch {}
  } catch (error) {
    logger.error('Post task update to channel error:', error);
  }
}

export function generateTaskCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TC-${timestamp}${random}`;
}
