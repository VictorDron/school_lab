import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';

const unviewedCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL_MS = 30000; // 30 seconds cache

/**
 * Get count of leads with FORM_RECEIVED status that user hasn't viewed
 * Uses in-memory cache to reduce database load (30s TTL)
 */
export async function getUnviewedLeadsCount(userId: string): Promise<number> {
  const startTime = Date.now();

  const cached = unviewedCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    logger.debug(`[UnviewedCache] HIT for user ${userId.slice(0, 8)}... count=${cached.count} (${Date.now() - startTime}ms)`);
    return cached.count;
  }

  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "Lead" l
    WHERE l."applicationStatus" = 'FORM_RECEIVED'
    AND NOT EXISTS (
      SELECT 1 FROM "LeadView" lv
      WHERE lv."leadId" = l.id
      AND lv."userId" = ${userId}
    )
  `;

  const count = Number(result[0]?.count || 0);
  const queryTime = Date.now() - startTime;

  unviewedCache.set(userId, { count, timestamp: Date.now() });

  logger.debug(`[UnviewedCache] MISS for user ${userId.slice(0, 8)}... count=${count} (${queryTime}ms query)`);

  return count;
}

/**
 * Invalidate unviewed cache for a user (call when marking lead as viewed)
 */
export function invalidateUnviewedCache(userId: string): void {
  const hadCache = unviewedCache.has(userId);
  unviewedCache.delete(userId);
  if (hadCache) {
    logger.debug(`[UnviewedCache] INVALIDATED for user ${userId.slice(0, 8)}...`);
  }
}

/**
 * Mark a lead as viewed by the user
 */
export async function markLeadAsViewed(leadId: string, userId: string): Promise<void> {
  await prisma.leadView.upsert({
    where: {
      leadId_userId: { leadId, userId },
    },
    create: {
      leadId,
      userId,
    },
    update: {
      viewedAt: new Date(),
    },
  });

  invalidateUnviewedCache(userId);
}

/**
 * Mark all leads with FORM_RECEIVED status as viewed by the user
 * Returns the number of leads marked
 */
export async function markAllLeadsAsViewed(userId: string): Promise<number> {
  const unviewedLeads = await prisma.$queryRaw<{ id: string }[]>`
    SELECT l.id
    FROM "Lead" l
    WHERE l."applicationStatus" = 'FORM_RECEIVED'
    AND NOT EXISTS (
      SELECT 1 FROM "LeadView" lv
      WHERE lv."leadId" = l.id
      AND lv."userId" = ${userId}
    )
  `;

  if (unviewedLeads.length === 0) {
    return 0;
  }

  await prisma.leadView.createMany({
    data: unviewedLeads.map((lead) => ({
      leadId: lead.id,
      userId,
    })),
    skipDuplicates: true,
  });

  invalidateUnviewedCache(userId);

  logger.debug(`[UnviewedCache] MARKED ALL ${unviewedLeads.length} leads as viewed for user ${userId.slice(0, 8)}...`);

  return unviewedLeads.length;
}
