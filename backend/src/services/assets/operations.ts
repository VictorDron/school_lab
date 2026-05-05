import QRCode from 'qrcode';
import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import { uploadFile } from '../../config/supabase.js';
import { generateCode } from '../../utils/helpers.js';
import { createAuditLog } from '../audit.service.js';
import { createNotification } from '../notification.service.js';
import type {
  AssetFilters,
  AssetPagination,
  CreateAssetData,
  UpdateAssetData,
} from './types.js';

export async function listAssets(filters: AssetFilters, pagination: AssetPagination) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.locationId) where.locationId = filters.locationId;
  if (filters.responsibleId) where.responsibleId = filters.responsibleId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { serialNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [assets, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: true,
        location: true,
        responsible: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.asset.count({ where }),
  ]);

  return {
    assets,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      responsible: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      createdBy: { select: { id: true, displayName: true } },
      movements: {
        include: {
          fromLocation: true,
          toLocation: true,
          movedBy: { select: { id: true, displayName: true } },
        },
        orderBy: { movedAt: 'desc' },
        take: 10,
      },
      maintenance: { orderBy: { startDate: 'desc' }, take: 10 },
    },
  });
}

/**
 * Create an asset and pre-render its QR code. The QR is generated synchronously
 * and uploaded to storage so the asset is immediately printable from the
 * frontend — no async hand-off, no missing-image race.
 */
export async function createAsset(data: CreateAssetData, userId: string, userEmail: string) {
  const code = generateCode('AST');

  const qrDataUrl = await QRCode.toDataURL(code, { width: 300 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
  const qrCodeUrl = await uploadFile(qrBuffer, `assets/qr/${code}.png`, 'image/png');

  const asset = await prisma.asset.create({
    data: {
      tenantId: requireTenantId(),
      code,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      locationId: data.locationId,
      status: data.status || 'AVAILABLE',
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined,
      acquisitionValue: data.acquisitionValue,
      warranty: data.warranty ? new Date(data.warranty) : undefined,
      notes: data.notes,
      qrCodeUrl,
      createdById: userId,
    },
    include: { category: true, location: true },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'ASSET_CREATED',
    entityType: 'ASSET',
    entityId: asset.id,
    metadata: { code: asset.code, name: asset.name },
  });

  return asset;
}

/**
 * Move an asset between locations. Always writes an AssetMovement row first
 * — the audit trail is preserved even if a downstream update fails. Refuses
 * a no-op move so the movement log doesn't accumulate noise.
 */
export async function moveAsset(
  id: string,
  locationId: string,
  reason: string | undefined,
  userId: string,
  userEmail: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    return { error: 'NOT_FOUND' as const };
  }

  if (asset.locationId === locationId) {
    return { error: 'SAME_LOCATION' as const };
  }

  await prisma.assetMovement.create({
    data: {
      assetId: asset.id,
      fromLocationId: asset.locationId,
      toLocationId: locationId,
      reason,
      movedById: userId,
    },
  });

  const updated = await prisma.asset.update({
    where: { id },
    data: { locationId },
    include: { category: true, location: true },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'ASSET_MOVED',
    entityType: 'ASSET',
    entityId: asset.id,
    metadata: { fromLocationId: asset.locationId, toLocationId: locationId },
  });

  return { data: updated };
}

/**
 * Assign or unassign an asset. Passing `null` for the target user unassigns
 * and flips status to AVAILABLE; assigning to a user flips status to IN_USE
 * and pings them. Status flips here intentionally — callers should not pass
 * status separately, since IN_USE/AVAILABLE follow from responsibility.
 */
export async function assignAsset(
  id: string,
  targetUserId: string | null,
  actorId: string,
  actorEmail: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id } });

  if (!asset) {
    return { error: 'NOT_FOUND' as const };
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: { responsibleId: targetUserId, status: targetUserId ? 'IN_USE' : 'AVAILABLE' },
    include: { category: true, location: true, responsible: { select: { id: true, displayName: true } } },
  });

  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      type: 'asset_assigned',
      title: 'Ativo Atribuído',
      message: `O ativo "${asset.name}" foi atribuído a você.`,
      data: { assetId: asset.id, assetCode: asset.code },
    });
  }

  await createAuditLog({
    actorId,
    actorEmail,
    action: targetUserId ? 'ASSET_ASSIGNED' : 'ASSET_UNASSIGNED',
    entityType: 'ASSET',
    entityId: asset.id,
    metadata: { responsibleId: targetUserId },
  });

  return { data: updated };
}

export async function updateAsset(
  id: string,
  data: UpdateAssetData,
  userId: string,
  userEmail: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return { error: 'NOT_FOUND' as const };
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.categoryId && { categoryId: data.categoryId }),
      ...(data.locationId && { locationId: data.locationId }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.acquisitionDate && { acquisitionDate: new Date(data.acquisitionDate) }),
      ...(data.acquisitionValue !== undefined && { acquisitionValue: data.acquisitionValue }),
      ...(data.currentValue !== undefined && { currentValue: data.currentValue }),
      ...(data.warranty && { warranty: new Date(data.warranty) }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.depreciationRate !== undefined && { depreciationRate: data.depreciationRate }),
    },
    include: {
      category: true,
      location: true,
      responsible: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'ASSET_UPDATED',
    entityType: 'ASSET',
    entityId: asset.id,
    metadata: { code: asset.code },
  });

  return { data: updated };
}

/**
 * Soft-decommission: status flips to DECOMMISSIONED, the responsible user is
 * cleared, and they're notified. We never hard-delete assets — historical
 * audit trails and movement history must remain queryable.
 */
export async function decommissionAsset(
  id: string,
  reason: string | undefined,
  userId: string,
  userEmail: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return { error: 'NOT_FOUND' as const };
  }

  if (asset.status === 'DECOMMISSIONED') {
    return { error: 'ALREADY_DECOMMISSIONED' as const };
  }

  const updated = await prisma.asset.update({
    where: { id },
    data: { status: 'DECOMMISSIONED', responsibleId: null },
  });

  if (asset.responsibleId) {
    await createNotification({
      userId: asset.responsibleId,
      type: 'asset_decommissioned',
      title: 'Ativo Desativado',
      message: `O ativo "${asset.name}" (${asset.code}) foi desativado.`,
      data: { assetId: asset.id, assetCode: asset.code },
    });
  }

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'ASSET_DECOMMISSIONED',
    entityType: 'ASSET',
    entityId: asset.id,
    metadata: { code: asset.code, reason },
  });

  return { data: updated };
}
