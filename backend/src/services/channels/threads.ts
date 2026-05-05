import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { notifyMentionedUsers, parseMentions, resolveUserMentions } from '../mention.service.js';
import { createNotification } from '../notification.service.js';
import { REACTIONS_INCLUDE, SENDER_SELECT } from './shared.js';
import type { SendMessageData } from './shared.js';

export async function getThreadReplies(
  channelId: string,
  messageId: string,
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

  const [replies, total] = await Promise.all([
    prisma.message.findMany({
      where: { parentId: messageId, channelId, isDeleted: false },
      include: {
        sender: { select: SENDER_SELECT },
        reactions: { include: REACTIONS_INCLUDE },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { parentId: messageId, channelId, isDeleted: false } }),
  ]);

  return {
    replies,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Reply inside a thread. Notifies every distinct prior participant of the
 * thread (parent author + previous repliers) so they get a ping when the
 * conversation continues. Mentions still trigger their own notifications
 * via notifyMentionedUsers.
 */
export async function sendThreadReply(
  channelId: string,
  parentMessageId: string,
  userId: string,
  data: SendMessageData,
  senderDisplayName: string,
) {
  const isMember = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (!isMember) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel || channel.type !== 'PUBLIC') {
      throw new AppError(403, 'Você não tem acesso a este canal', 'NO_ACCESS');
    }
    await prisma.channelMember.create({ data: { channelId, userId } });
  }

  const parentMessage = await prisma.message.findFirst({
    where: { id: parentMessageId, channelId, isDeleted: false },
  });

  if (!parentMessage) {
    throw new AppError(404, 'Mensagem original não encontrada', 'PARENT_NOT_FOUND');
  }

  const reply = await prisma.message.create({
    data: {
      channelId,
      senderId: userId,
      content: data.content,
      attachments: data.attachments,
      parentId: parentMessageId,
    },
    include: {
      sender: { select: SENDER_SELECT },
      reactions: true,
    },
  });

  const threadParticipants = await prisma.message.findMany({
    where: {
      OR: [{ id: parentMessageId }, { parentId: parentMessageId }],
      senderId: { not: userId },
    },
    select: { senderId: true },
    distinct: ['senderId'],
  });

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { name: true },
  });

  for (const participant of threadParticipants) {
    await createNotification({
      userId: participant.senderId,
      type: 'thread_reply',
      title: 'Nova resposta na thread',
      message: `${senderDisplayName} respondeu em uma thread em #${channel?.name || 'canal'}`,
      data: { messageId: reply.id, parentId: parentMessageId, channelId },
    });
  }

  const rawMentions = parseMentions(data.content);
  if (rawMentions.length > 0) {
    const resolved = await resolveUserMentions(rawMentions, channelId);
    const mentionData = resolved
      .filter((m) => m.userId && m.userId !== userId)
      .map((m) => ({ messageId: reply.id, userId: m.userId!, type: m.type }));
    if (mentionData.length > 0) {
      await prisma.messageMention.createMany({ data: mentionData });
      await notifyMentionedUsers(
        resolved.filter((m) => m.userId !== userId),
        { id: reply.id, content: data.content, channelId },
        senderDisplayName,
        channel?.name || 'canal',
      );
    }
  }

  return { reply, parentId: parentMessageId, channelId };
}
