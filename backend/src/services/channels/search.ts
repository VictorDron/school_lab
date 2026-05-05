import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { searchMessages as searchMessagesFromService } from '../search.service.js';
import { USER_DETAILS_SELECT } from './shared.js';

export async function searchChannelMessages(
  query: string,
  userId: string,
  options: {
    page: number;
    limit: number;
    channelId?: string;
    senderId?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  if (options.channelId) {
    const hasAccess = await prisma.channel.findFirst({
      where: {
        id: options.channelId,
        OR: [
          { type: 'PUBLIC' },
          { members: { some: { userId } } },
        ],
      },
      select: { id: true },
    });
    if (!hasAccess) {
      throw new AppError(403, 'Sem acesso a este canal', 'NO_CHANNEL_ACCESS');
    }
  }

  return searchMessagesFromService(query, userId, options);
}

/**
 * User picker for @mentions and DM start. Active-only, capped at 20, and
 * a blank query returns the alphabetical top of the directory.
 */
export async function searchUsers(query: string) {
  return prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      ...(query.length >= 1
        ? {
            OR: [
              { displayName: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    select: USER_DETAILS_SELECT,
    take: 20,
    orderBy: { displayName: 'asc' },
  });
}
