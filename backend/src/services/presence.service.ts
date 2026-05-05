import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';

const PRESENCE_TTL = 300; // 5 minutes
const PRESENCE_KEY_PREFIX = 'user:online:';

export async function setUserPresence(userId: string, status: string) {
  if (status === 'OFFLINE') {
    await redis.del(`${PRESENCE_KEY_PREFIX}${userId}`);
  } else {
    await redis.set(`${PRESENCE_KEY_PREFIX}${userId}`, status, 'EX', PRESENCE_TTL);
  }
}

export async function getUserPresence(userId: string): Promise<string> {
  const status = await redis.get(`${PRESENCE_KEY_PREFIX}${userId}`);
  return status || 'OFFLINE';
}

export async function getBulkPresence(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const pipeline = redis.pipeline();
  for (const userId of userIds) {
    pipeline.get(`${PRESENCE_KEY_PREFIX}${userId}`);
  }
  const results = await pipeline.exec();

  const presenceMap: Record<string, string> = {};
  userIds.forEach((userId, index) => {
    const result = results?.[index]?.[1] as string | null;
    presenceMap[userId] = result || 'OFFLINE';
  });

  return presenceMap;
}

export async function getOnlineUsersInChannel(channelId: string): Promise<string[]> {
  const members = await prisma.channelMember.findMany({
    where: { channelId },
    select: { userId: true },
  });

  const userIds = members.map((m) => m.userId);
  const presenceMap = await getBulkPresence(userIds);

  return Object.entries(presenceMap)
    .filter(([, status]) => status !== 'OFFLINE')
    .map(([userId]) => userId);
}
