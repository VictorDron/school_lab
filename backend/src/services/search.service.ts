import { prisma } from '../config/database.js';

interface SearchOptions {
  page?: number;
  limit?: number;
  channelId?: string;
  senderId?: string;
  startDate?: string;
  endDate?: string;
}

export async function searchMessages(query: string, userId: string, options: SearchOptions = {}) {
  const { page = 1, limit = 20, channelId, senderId, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  // Get channels the user has access to
  const accessibleChannels = await prisma.channel.findMany({
    where: {
      isArchived: false,
      OR: [
        { type: 'PUBLIC' },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  const accessibleChannelIds = accessibleChannels.map((c) => c.id);

  const where: any = {
    isDeleted: false,
    channelId: channelId
      ? { in: accessibleChannelIds.includes(channelId) ? [channelId] : [] }
      : { in: accessibleChannelIds },
    content: {
      contains: query,
      mode: 'insensitive',
    },
  };

  if (senderId) {
    where.senderId = senderId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        channel: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  return {
    messages,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
