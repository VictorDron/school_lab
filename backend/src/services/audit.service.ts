import { prisma } from '../config/database.js';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';
import logger from '../utils/logger.js';

interface AuditLogData {
  actorId?: string;
  actorEmail: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export async function createAuditLog(data: AuditLogData, req?: Request) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        actorEmail: data.actorEmail,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        ipAddress: req?.ip || req?.socket?.remoteAddress,
        userAgent: req?.get('User-Agent'),
        metadata: data.metadata,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  actorId?: string;
  action?: AuditAction;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}) {
  const { page = 1, limit = 50, actorId, action, entityType, startDate, endDate, search } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (actorId) where.actorId = actorId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Add text search capability
  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search, mode: 'insensitive' } },
      { actor: { displayName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAuditStats(params: {
  startDate?: Date;
  endDate?: Date;
}) {
  const { startDate, endDate } = params;

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Get counts by action
  const actionCounts = await prisma.auditLog.groupBy({
    by: ['action'],
    where,
    _count: true,
    orderBy: {
      _count: {
        action: 'desc',
      },
    },
  });

  // Get counts by entity type
  const entityTypeCounts = await prisma.auditLog.groupBy({
    by: ['entityType'],
    where: {
      ...where,
      entityType: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        entityType: 'desc',
      },
    },
  });

  // Get most active users
  const topUsers = await prisma.auditLog.groupBy({
    by: ['actorId', 'actorEmail'],
    where: {
      ...where,
      actorId: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        actorId: 'desc',
      },
    },
    take: 10,
  });

  // Get total count
  const totalCount = await prisma.auditLog.count({ where });

  // Get login failures count
  const loginFailures = await prisma.auditLog.count({
    where: {
      ...where,
      action: 'LOGIN_FAILURE',
    },
  });

  // Get login successes count
  const loginSuccesses = await prisma.auditLog.count({
    where: {
      ...where,
      action: 'LOGIN_SUCCESS',
    },
  });

  return {
    totalCount,
    loginFailures,
    loginSuccesses,
    actionCounts: actionCounts.map((item) => ({
      action: item.action,
      count: item._count,
    })),
    entityTypeCounts: entityTypeCounts.map((item) => ({
      entityType: item.entityType,
      count: item._count,
    })),
    topUsers: topUsers.map((item) => ({
      actorId: item.actorId,
      actorEmail: item.actorEmail,
      count: item._count,
    })),
  };
}

export async function getUniqueEntityTypes() {
  const entityTypes = await prisma.auditLog.findMany({
    where: {
      entityType: { not: null },
    },
    select: {
      entityType: true,
    },
    distinct: ['entityType'],
    orderBy: {
      entityType: 'asc',
    },
  });

  return entityTypes.map((item) => item.entityType).filter(Boolean);
}
