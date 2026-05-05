import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import { redis } from '../../config/redis.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { createNotification } from '../notification.service.js';
import { SENDER_SELECT, USER_DETAILS_SELECT } from './shared.js';
import type { CreateChannelData } from './shared.js';

/**
 * Channels visible to a user: public ones plus those they're a member of.
 * Unread counts come from Redis (one key per channel/user). The last
 * message preview is the most recent one in the channel — used for the
 * sidebar list.
 */
export async function getChannelsForUser(userId: string) {
  const channels = await prisma.channel.findMany({
    where: {
      isArchived: false,
      OR: [
        { type: 'PUBLIC' },
        { members: { some: { userId } } },
      ],
    },
    include: {
      members: {
        where: { userId },
        take: 1,
      },
      _count: {
        select: { members: true, messages: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: { id: true, displayName: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const unreadKeys = channels.map((c) => `channel:${c.id}:unread:${userId}`);
  const unreadValues = unreadKeys.length > 0 ? await redis.mget(...unreadKeys) : [];

  return channels.map((channel, i) => ({
    ...channel,
    unreadCount: parseInt(unreadValues[i] || '0'),
    isMember: channel.members.length > 0,
    lastMessage: channel.messages[0] || null,
  }));
}

export async function getDirectMessagesForUser(userId: string) {
  const dmChannels = await prisma.channel.findMany({
    where: {
      type: 'DIRECT',
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              ...USER_DETAILS_SELECT,
              status: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return Promise.all(
    dmChannels.map(async (channel) => {
      const otherMember = channel.members.find((m) => m.userId !== userId);
      const unreadKey = `channel:${channel.id}:unread:${userId}`;
      const unreadCount = await redis.get(unreadKey);

      const isOnline = otherMember
        ? await redis.get(`user:online:${otherMember.userId}`) === 'true'
        : false;

      return {
        id: channel.id,
        user: otherMember?.user,
        isOnline,
        lastMessage: channel.messages[0] || null,
        unreadCount: parseInt(unreadCount || '0'),
      };
    })
  );
}

export async function createChannel(data: CreateChannelData, creatorId: string) {
  const channel = await prisma.channel.create({
    data: {
      tenantId: requireTenantId(),
      name: data.name,
      description: data.description,
      type: data.type || 'PUBLIC',
      createdBy: creatorId,
      members: {
        create: [
          { userId: creatorId, isOwner: true, isAdmin: true },
          ...(data.memberIds || []).map((id) => ({ userId: id })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: SENDER_SELECT,
          },
        },
      },
    },
  });

  if (data.memberIds && data.memberIds.length > 0) {
    for (const memberId of data.memberIds) {
      await createNotification({
        userId: memberId,
        type: 'channel_added',
        title: 'Adicionado ao Canal',
        message: `Você foi adicionado ao canal "${data.name}"`,
        data: {
          channelId: channel.id,
          channelName: data.name,
        },
      });
    }
  }

  return channel;
}

/**
 * Returns the existing DM if one already exists between the two users,
 * otherwise creates a fresh DIRECT channel. Refuses self-DMs because the
 * UI/state model assumes two distinct members per DM.
 */
export async function createOrGetDirectMessage(userId: string, targetUserId: string) {
  if (targetUserId === userId) {
    throw new AppError(400, 'Você não pode criar uma conversa consigo mesmo', 'SELF_DM');
  }

  const existingDm = await prisma.channel.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
  });

  if (existingDm) {
    return { channel: existingDm, isNew: false };
  }

  const dm = await prisma.channel.create({
    data: {
      tenantId: requireTenantId(),
      name: 'Direct Message',
      type: 'DIRECT',
      createdBy: userId,
      members: {
        create: [
          { userId },
          { userId: targetUserId },
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: SENDER_SELECT,
          },
        },
      },
    },
  });

  return { channel: dm, isNew: true };
}

export async function joinChannel(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });

  if (!channel) {
    throw new AppError(404, 'Canal não encontrado', 'CHANNEL_NOT_FOUND');
  }

  if (channel.type === 'PRIVATE') {
    throw new AppError(403, 'Este canal é privado', 'CHANNEL_PRIVATE');
  }

  const existingMember = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (existingMember) {
    return { alreadyMember: true };
  }

  await prisma.channelMember.create({
    data: { channelId, userId },
  });

  return { alreadyMember: false };
}

/**
 * Leave a channel — owner can't leave because that would orphan the room.
 * Channel ownership transfer is a separate (still-unimplemented) flow.
 */
export async function leaveChannel(channelId: string, userId: string) {
  const member = await prisma.channelMember.findUnique({
    where: { channelId_userId: { channelId, userId } },
  });

  if (!member) {
    throw new AppError(400, 'Você não é membro deste canal', 'NOT_A_MEMBER');
  }

  if (member.isOwner) {
    throw new AppError(400, 'O dono do canal não pode sair. Transfira a propriedade primeiro.', 'OWNER_CANNOT_LEAVE');
  }

  await prisma.channelMember.delete({
    where: { id: member.id },
  });
}

export async function getChannelMembers(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { type: true, members: { where: { userId }, take: 1 } },
  });

  if (!channel) {
    throw new AppError(404, 'Canal não encontrado', 'CHANNEL_NOT_FOUND');
  }

  if (channel.type !== 'PUBLIC' && channel.members.length === 0) {
    throw new AppError(403, 'Você não tem acesso a este canal', 'NO_ACCESS');
  }

  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: { select: USER_DETAILS_SELECT },
    },
  });

  const onlineKeys = members.map((m) => `user:online:${m.userId}`);
  const onlineValues = onlineKeys.length > 0 ? await redis.mget(...onlineKeys) : [];

  return members.map((member, i) => ({
    ...member,
    isOnline: onlineValues[i] === 'true',
  }));
}
