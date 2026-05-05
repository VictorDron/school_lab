import { prisma } from '../../config/database.js';
import { createAuditLog } from '../audit.service.js';
import { createNotification } from '../notification.service.js';
import type {
  CompleteMaintenanceData,
  CreateMaintenanceData,
} from './types.js';

const UPCOMING_WINDOW_DAYS = 30;

/**
 * Maintenance scheduled within the next 30 days. Capped at 20 records to
 * keep the dashboard widget fast — the full list lives behind the asset
 * detail page.
 */
export async function getUpcomingMaintenance() {
  const upcomingCutoff = new Date();
  upcomingCutoff.setDate(upcomingCutoff.getDate() + UPCOMING_WINDOW_DAYS);

  return prisma.assetMaintenance.findMany({
    where: {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledDate: { lte: upcomingCutoff },
    },
    include: {
      asset: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, displayName: true } },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 20,
  });
}

export async function getOverdueMaintenance() {
  return prisma.assetMaintenance.findMany({
    where: {
      status: { in: ['SCHEDULED', 'OVERDUE'] },
      scheduledDate: { lt: new Date() },
    },
    include: {
      asset: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, displayName: true } },
    },
    orderBy: { scheduledDate: 'asc' },
  });
}

export async function getMaintenanceHistory(assetId: string) {
  return prisma.assetMaintenance.findMany({
    where: { assetId },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
      completedBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMaintenance(
  assetId: string,
  data: CreateMaintenanceData,
  userId: string,
  userEmail: string,
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    return { error: 'NOT_FOUND' as const };
  }

  const maintenance = await prisma.assetMaintenance.create({
    data: {
      assetId: asset.id,
      type: data.type || 'CORRECTIVE',
      description: data.description,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      priority: data.priority || 'NORMAL',
      vendor: data.vendor,
      notes: data.notes,
      cost: data.cost,
      status: 'SCHEDULED',
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  // Corrective maintenance takes the asset out of service immediately;
  // preventive maintenance schedules without changing status.
  if (data.type === 'CORRECTIVE') {
    await prisma.asset.update({
      where: { id: asset.id },
      data: { status: 'MAINTENANCE' },
    });
  }

  if (asset.responsibleId) {
    await createNotification({
      userId: asset.responsibleId,
      type: 'maintenance_scheduled',
      title: 'Manutenção Agendada',
      message: `Manutenção agendada para "${asset.name}" (${asset.code}).`,
      data: { assetId: asset.id, assetCode: asset.code, maintenanceId: maintenance.id },
    });
  }

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'MAINTENANCE_CREATED',
    entityType: 'ASSET_MAINTENANCE',
    entityId: maintenance.id,
    metadata: { assetCode: asset.code, type: data.type },
  });

  return { data: maintenance };
}

export async function completeMaintenance(
  assetId: string,
  maintenanceId: string,
  data: CompleteMaintenanceData,
  userId: string,
  userEmail: string,
) {
  const maintenance = await prisma.assetMaintenance.findFirst({
    where: { id: maintenanceId, assetId },
    include: { asset: true },
  });

  if (!maintenance) {
    return { error: 'NOT_FOUND' as const };
  }

  if (maintenance.status === 'COMPLETED') {
    return { error: 'ALREADY_COMPLETED' as const };
  }

  const updated = await prisma.assetMaintenance.update({
    where: { id: maintenanceId },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
      completedById: userId,
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.notes && { notes: data.notes }),
    },
  });

  // If the corrective maintenance pulled the asset to MAINTENANCE, restore it
  // to its prior status (IN_USE if assigned, AVAILABLE otherwise).
  if (maintenance.asset.status === 'MAINTENANCE') {
    const previousStatus = maintenance.asset.responsibleId ? 'IN_USE' : 'AVAILABLE';
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: previousStatus },
    });
  }

  if (maintenance.asset.responsibleId) {
    await createNotification({
      userId: maintenance.asset.responsibleId,
      type: 'maintenance_completed',
      title: 'Manutenção Concluída',
      message: `Manutenção do ativo "${maintenance.asset.name}" foi concluída.`,
      data: { assetId: maintenance.asset.id, assetCode: maintenance.asset.code },
    });
  }

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'MAINTENANCE_COMPLETED',
    entityType: 'ASSET_MAINTENANCE',
    entityId: maintenance.id,
    metadata: { assetCode: maintenance.asset.code },
  });

  return { data: updated };
}
