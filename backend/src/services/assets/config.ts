import { prisma } from '../../config/database.js';
import { createAuditLog } from '../audit.service.js';

interface CategoryUpsertData {
  name?: string;
  description?: string;
  icon?: string;
}

interface LocationUpsertData {
  name?: string;
  description?: string;
  parentId?: string;
}

// ==================== CATEGORIES ====================

export async function listCategories() {
  return prisma.assetCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function createCategory(
  data: { name: string; description?: string; icon?: string },
  userId: string,
  userEmail: string,
) {
  const category = await prisma.assetCategory.create({
    data: { name: data.name, description: data.description, icon: data.icon },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'CATEGORY_CREATED',
    entityType: 'ASSET_CATEGORY',
    entityId: category.id,
    metadata: { name: data.name },
  });

  return category;
}

export async function updateCategory(
  id: string,
  data: CategoryUpsertData,
  userId: string,
  userEmail: string,
) {
  const updated = await prisma.assetCategory.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.icon !== undefined && { icon: data.icon }),
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'CATEGORY_UPDATED',
    entityType: 'ASSET_CATEGORY',
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return updated;
}

/**
 * Refuses to delete a category that still has assets attached — caller must
 * reassign or decommission those first to avoid orphaning rows that reference
 * a missing categoryId.
 */
export async function deleteCategory(id: string, userId: string, userEmail: string) {
  const assetCount = await prisma.asset.count({ where: { categoryId: id } });
  if (assetCount > 0) {
    return { error: 'HAS_ASSETS' as const, assetCount };
  }

  await prisma.assetCategory.delete({ where: { id } });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'CATEGORY_DELETED',
    entityType: 'ASSET_CATEGORY',
    entityId: id,
  });

  return { success: true };
}

// ==================== LOCATIONS ====================

export async function listLocations() {
  return prisma.assetLocation.findMany({
    include: { parent: true, children: true },
    orderBy: { name: 'asc' },
  });
}

export async function createLocation(
  data: { name: string; description?: string; parentId?: string },
  userId: string,
  userEmail: string,
) {
  const location = await prisma.assetLocation.create({
    data: { name: data.name, description: data.description, parentId: data.parentId },
    include: { parent: true },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'LOCATION_CREATED',
    entityType: 'ASSET_LOCATION',
    entityId: location.id,
    metadata: { name: data.name, parentId: data.parentId },
  });

  return location;
}

export async function updateLocation(
  id: string,
  data: LocationUpsertData,
  userId: string,
  userEmail: string,
) {
  const updated = await prisma.assetLocation.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.parentId !== undefined && { parentId: data.parentId }),
    },
    include: { parent: true, children: true },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'LOCATION_UPDATED',
    entityType: 'ASSET_LOCATION',
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return updated;
}

/**
 * Refuses to delete if the location has assets OR child locations — both
 * would orphan referencing rows. Caller must move/decommission assets and
 * reparent or delete children first.
 */
export async function deleteLocation(id: string, userId: string, userEmail: string) {
  const [assetCount, childCount] = await Promise.all([
    prisma.asset.count({ where: { locationId: id } }),
    prisma.assetLocation.count({ where: { parentId: id } }),
  ]);

  if (assetCount > 0) {
    return { error: 'HAS_ASSETS' as const, assetCount };
  }
  if (childCount > 0) {
    return { error: 'HAS_CHILDREN' as const, childCount };
  }

  await prisma.assetLocation.delete({ where: { id } });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'LOCATION_DELETED',
    entityType: 'ASSET_LOCATION',
    entityId: id,
  });

  return { success: true };
}
