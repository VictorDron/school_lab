import { prisma } from '../../config/database.js';
import { generateCode } from '../../utils/helpers.js';
import { createAuditLog } from '../audit.service.js';
import type { CheckInventoryItemData } from './types.js';

export async function listInventorySessions() {
  return prisma.inventorySession.findMany({
    include: {
      startedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      completedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      location: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

interface CreateSessionData {
  name: string;
  description?: string;
  locationId?: string;
  categoryId?: string;
}

/**
 * Open a new inventory session. Snapshot the asset list at creation time
 * (filtered by location/category if scoped) and seed one PENDING
 * InventoryItem per asset — that becomes the checklist for the audit.
 * Decommissioned assets are excluded.
 */
export async function createInventorySession(
  data: CreateSessionData,
  userId: string,
  userEmail: string,
) {
  const assetWhere: any = { status: { not: 'DECOMMISSIONED' } };
  if (data.locationId) assetWhere.locationId = data.locationId;
  if (data.categoryId) assetWhere.categoryId = data.categoryId;

  const assets = await prisma.asset.findMany({ where: assetWhere, select: { id: true } });

  const session = await prisma.inventorySession.create({
    data: {
      code: generateCode('INV'),
      name: data.name,
      description: data.description,
      locationId: data.locationId,
      categoryId: data.categoryId,
      status: 'DRAFT',
      startedById: userId,
      totalAssets: assets.length,
      items: {
        create: assets.map(asset => ({
          assetId: asset.id,
          status: 'PENDING',
        })),
      },
    },
    include: {
      startedBy: { select: { id: true, displayName: true } },
      _count: { select: { items: true } },
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'INVENTORY_STARTED',
    entityType: 'INVENTORY',
    entityId: session.id,
    metadata: { code: session.code, totalAssets: assets.length },
  });

  return session;
}

export async function getInventorySession(sessionId: string) {
  return prisma.inventorySession.findUnique({
    where: { id: sessionId },
    include: {
      startedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      completedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      location: true,
      category: true,
      items: {
        include: {
          asset: {
            select: { id: true, code: true, name: true, status: true, category: true, location: true },
          },
          checkedBy: { select: { id: true, displayName: true } },
        },
        orderBy: { asset: { code: 'asc' } },
      },
    },
  });
}

/**
 * Flip a DRAFT session to IN_PROGRESS — anything else (already started or
 * completed) is rejected so we don't reset timestamps. The userId param is
 * kept for API compatibility with the controller; the audit trail for
 * starting lives on the createInventorySession entry.
 */
export async function startInventory(sessionId: string, _userId: string) {
  const session = await prisma.inventorySession.findUnique({ where: { id: sessionId } });
  if (!session || session.status !== 'DRAFT') {
    return { error: 'INVALID_SESSION' as const };
  }

  const updated = await prisma.inventorySession.update({
    where: { id: sessionId },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

  return { data: updated };
}

/**
 * Mark a single inventory item as FOUND/NOT_FOUND/etc. The session-level
 * found/missing counters only bump when transitioning from PENDING — re-
 * checking an already-checked item changes its status without double-
 * counting.
 */
export async function checkInventoryItem(
  sessionId: string,
  itemId: string,
  data: CheckInventoryItemData,
  userId: string,
  userEmail: string,
) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: itemId, sessionId },
  });

  if (!item) {
    return { error: 'NOT_FOUND' as const };
  }

  const wasPending = item.status === 'PENDING';

  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      status: data.status,
      notes: data.notes,
      checkedById: userId,
      checkedAt: new Date(),
    },
  });

  if (wasPending) {
    const updateData: any = {};
    if (data.status === 'FOUND') updateData.foundCount = { increment: 1 };
    if (data.status === 'NOT_FOUND') updateData.missingCount = { increment: 1 };

    await prisma.inventorySession.update({
      where: { id: sessionId },
      data: updateData,
    });
  }

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'INVENTORY_ITEM_CHECKED',
    entityType: 'INVENTORY_ITEM',
    entityId: item.id,
    metadata: { status: data.status, sessionId },
  });

  return { data: updated };
}

/**
 * Close an IN_PROGRESS session. Refuses to close while any item is still
 * PENDING — the caller must explicitly mark them NOT_FOUND or otherwise
 * resolve them so the audit isn't completed with hidden gaps.
 */
export async function completeInventory(sessionId: string, userId: string, userEmail: string) {
  const session = await prisma.inventorySession.findUnique({
    where: { id: sessionId },
    include: { _count: { select: { items: true } } },
  });

  if (!session || session.status !== 'IN_PROGRESS') {
    return { error: 'INVALID_SESSION' as const };
  }

  const pendingCount = await prisma.inventoryItem.count({
    where: { sessionId, status: 'PENDING' },
  });

  if (pendingCount > 0) {
    return { error: 'PENDING_ITEMS' as const, pendingCount };
  }

  const updated = await prisma.inventorySession.update({
    where: { id: sessionId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedById: userId,
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'INVENTORY_COMPLETED',
    entityType: 'INVENTORY',
    entityId: session.id,
    metadata: { code: session.code, found: session.foundCount, missing: session.missingCount, total: session.totalAssets },
  });

  return { data: updated };
}
