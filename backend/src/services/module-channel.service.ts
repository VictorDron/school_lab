import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { AppModule } from '@prisma/client';
import logger from '../utils/logger.js';

/**
 * Creates a private channel linked to a module entity (e.g., a purchase request or asset).
 * This enables contextual communication directly from within modules.
 */
export async function createModuleChannel(params: {
  module: AppModule;
  entityType: string;
  entityId: string;
  channelName: string;
  memberUserIds: string[];
  initialMessage?: string;
}) {
  try {
    const { module, entityType, entityId, channelName, memberUserIds, initialMessage } = params;

    if (memberUserIds.length === 0) {
      logger.warn('createModuleChannel: no members provided');
      return null;
    }

    const ownerId = memberUserIds[0];

    return await prisma.$transaction(async (tx) => {
      // 1. Create private channel
      const channel = await tx.channel.create({
        data: {
          name: channelName,
          type: 'PRIVATE',
          createdBy: ownerId,
        },
      });

      // 2. Add members
      await tx.channelMember.createMany({
        data: memberUserIds.map((userId, index) => ({
          channelId: channel.id,
          userId,
          isOwner: index === 0,
        })),
        skipDuplicates: true,
      });

      // 3. Register module-channel link
      await tx.moduleChannel.create({
        data: {
          channelId: channel.id,
          module,
          entityType,
          entityId,
        },
      });

      // 4. Post initial system message
      if (initialMessage) {
        await tx.message.create({
          data: {
            channelId: channel.id,
            senderId: ownerId,
            content: initialMessage,
          },
        });
      }

      return channel;
    });
  } catch (error) {
    logger.error('createModuleChannel error:', error);
    return null;
  }
}

/**
 * Find the channel linked to a specific module entity.
 */
export async function getModuleChannel(module: AppModule, entityType: string, entityId: string) {
  try {
    return await prisma.moduleChannel.findUnique({
      where: { module_entityType_entityId: { module, entityType, entityId } },
      include: { channel: true },
    });
  } catch (error) {
    logger.error('getModuleChannel error:', error);
    return null;
  }
}

/**
 * Add a member to an existing module channel.
 */
export async function addMemberToModuleChannel(
  module: AppModule,
  entityType: string,
  entityId: string,
  userId: string
) {
  try {
    const moduleChannel = await getModuleChannel(module, entityType, entityId);
    if (!moduleChannel) return null;

    return await prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId: moduleChannel.channelId, userId },
      },
      create: { channelId: moduleChannel.channelId, userId },
      update: {},
    });
  } catch (error) {
    logger.error('addMemberToModuleChannel error:', error);
    return null;
  }
}

/**
 * Post a system message to a module channel and broadcast via Redis.
 */
export async function postToModuleChannel(
  module: AppModule,
  entityType: string,
  entityId: string,
  message: string,
  senderId: string
) {
  try {
    const moduleChannel = await getModuleChannel(module, entityType, entityId);
    if (!moduleChannel) return null;

    const msg = await prisma.message.create({
      data: {
        channelId: moduleChannel.channelId,
        senderId,
        content: message,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Broadcast via Redis for real-time delivery
    await redis.publish(
      `channel:${moduleChannel.channelId}`,
      JSON.stringify(msg)
    );

    return msg;
  } catch (error) {
    logger.error('postToModuleChannel error:', error);
    return null;
  }
}

/**
 * Get users with specific module access level.
 * Useful for finding managers/finance users to add to channels.
 */
export async function getUsersWithModuleAccess(
  module: AppModule,
  minLevel: 'VIEW' | 'EDIT' | 'ADMIN' = 'ADMIN'
) {
  const accessLevels = ['NONE', 'VIEW', 'EDIT', 'ADMIN'];
  const minIdx = accessLevels.indexOf(minLevel);

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { role: 'ADMIN' },
        {
          moduleAccess: {
            some: {
              module,
              accessLevel: { in: accessLevels.slice(minIdx) as any },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return users.map((u) => u.id);
}
