import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import { redis } from '../../config/redis.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { notifyMentionedUsers, parseMentions, resolveUserMentions } from '../mention.service.js';
import { REACTIONS_INCLUDE, SENDER_SELECT } from './shared.js';
import type { SendMessageData } from './shared.js';

/**
 * Paginated message list. Returns oldest-first within the page so the chat
 * UI can append directly. Resets the unread counter for the requesting
 * user — calling this is the canonical "mark as read" action.
 */
export async function getMessages(
  channelId: string,
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      OR: [
        { type: 'PUBLIC' },
        { members: { some: { userId } } },
      ],
    },
  });

  if (!channel) {
    throw new AppError(404, 'Canal não encontrado', 'CHANNEL_NOT_FOUND');
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { channelId, isDeleted: false, parentId: null },
      include: {
        sender: { select: SENDER_SELECT },
        reads: {
          where: { userId },
          take: 1,
        },
        reactions: { include: REACTIONS_INCLUDE },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { channelId, isDeleted: false, parentId: null } }),
  ]);

  await redis.set(`channel:${channelId}:unread:${userId}`, '0');

  return {
    messages: messages.reverse(),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Send a message to a channel. Auto-joins the sender to PUBLIC channels —
 * convenient for inline replies. Unread counters and the realtime publish
 * are best-effort: a Redis blip should never lose a message that's already
 * persisted to Postgres.
 */
export async function sendMessage(
  channelId: string,
  userId: string,
  data: SendMessageData,
  senderDisplayName: string,
) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) {
    throw new AppError(404, 'Canal não encontrado', 'CHANNEL_NOT_FOUND');
  }

  const isMember = channel.members.some((m) => m.userId === userId);
  if (!isMember) {
    if (channel.type === 'PUBLIC') {
      await prisma.channelMember.create({ data: { channelId, userId } });
      channel.members.push({ userId } as any);
    } else {
      throw new AppError(403, 'Você não tem acesso a este canal', 'NO_ACCESS');
    }
  }

  const message = await prisma.message.create({
    data: {
      tenantId: requireTenantId(),
      channelId,
      senderId: userId,
      content: data.content,
      attachments: data.attachments,
    },
    include: {
      sender: { select: SENDER_SELECT },
      reactions: true,
      _count: { select: { replies: true } },
    },
  });

  await prisma.channel.update({
    where: { id: channelId },
    data: { updatedAt: new Date() },
  });

  const otherMembers = channel.members.filter((m) => m.userId !== userId);
  try {
    if (otherMembers.length > 0) {
      const pipeline = redis.pipeline();
      for (const member of otherMembers) {
        pipeline.incr(`channel:${channelId}:unread:${member.userId}`);
      }
      await pipeline.exec();
    }
    await redis.publish(`channel:${channelId}`, JSON.stringify(message));
  } catch (redisErr) {
    logger.warn('Redis operations failed for message send:', redisErr);
  }

  const rawMentions = parseMentions(data.content);
  if (rawMentions.length > 0) {
    const resolved = await resolveUserMentions(rawMentions, channelId);
    const mentionData = resolved
      .filter((m) => m.userId && m.userId !== userId)
      .map((m) => ({
        messageId: message.id,
        userId: m.userId!,
        type: m.type,
      }));
    if (mentionData.length > 0) {
      await prisma.messageMention.createMany({ data: mentionData });
      await notifyMentionedUsers(
        resolved.filter((m) => m.userId !== userId),
        { id: message.id, content: data.content, channelId },
        senderDisplayName,
        channel.name,
      );
    }
  }

  return { message, channelId };
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, isDeleted: false },
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada', 'MESSAGE_NOT_FOUND');
  }

  if (message.senderId !== userId) {
    throw new AppError(403, 'Você só pode editar suas próprias mensagens', 'NOT_MESSAGE_OWNER');
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { content, isEdited: true },
    include: {
      sender: { select: SENDER_SELECT },
    },
  });
}

/**
 * Soft-delete: flips isDeleted, preserves the row so threads/replies still
 * resolve. Senders can delete their own messages; ADMINs can delete any.
 */
export async function deleteMessage(messageId: string, userId: string, userRole: string) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, isDeleted: false },
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada', 'MESSAGE_NOT_FOUND');
  }

  if (message.senderId !== userId && userRole !== 'ADMIN') {
    throw new AppError(403, 'Sem permissão para excluir esta mensagem', 'NO_DELETE_PERMISSION');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });

  return { channelId: message.channelId };
}

export async function pinMessage(
  messageId: string,
  channelId: string,
  userId: string,
  userRole: string,
) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (!member || (!member.isAdmin && !member.isOwner && userRole !== 'ADMIN')) {
    throw new AppError(403, 'Apenas administradores podem fixar mensagens', 'NO_PIN_PERMISSION');
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, channelId, isDeleted: false },
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada', 'MESSAGE_NOT_FOUND');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isPinned: true, pinnedById: userId, pinnedAt: new Date() },
  });
}

export async function unpinMessage(
  messageId: string,
  channelId: string,
  userId: string,
  userRole: string,
) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (!member || (!member.isAdmin && !member.isOwner && userRole !== 'ADMIN')) {
    throw new AppError(403, 'Apenas administradores podem desfixar mensagens', 'NO_UNPIN_PERMISSION');
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { isPinned: false, pinnedById: null, pinnedAt: null },
  });
}

export async function getPinnedMessages(channelId: string) {
  return prisma.message.findMany({
    where: { channelId, isPinned: true, isDeleted: false },
    include: {
      sender: { select: SENDER_SELECT },
      pinnedBy: { select: { id: true, displayName: true } },
    },
    orderBy: { pinnedAt: 'desc' },
  });
}
