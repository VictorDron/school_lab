import { prisma } from '../../config/database.js';
import { generateCode } from '../../utils/helpers.js';
import { createAuditLog } from '../audit.service.js';
import type {
  CreatePurchaseData,
  PurchaseFilters,
  PurchasePagination,
  UpdatePurchaseData,
} from './types.js';

export async function listPurchases(filters: PurchaseFilters, pagination: PurchasePagination) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.department) where.department = filters.department;
  if (filters.createdById) where.createdById = filters.createdById;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [purchases, total] = await Promise.all([
    prisma.purchaseRequest.findMany({
      where,
      include: {
        creator: { select: { id: true, displayName: true, avatarUrl: true } },
        items: true,
        _count: { select: { approvalActions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.purchaseRequest.count({ where }),
  ]);

  return {
    purchases,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getPurchaseById(id: string) {
  return prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
      items: true,
      approvalActions: {
        include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
      purchaseOrder: { include: { supplier: true } },
    },
  });
}

export async function createPurchase(data: CreatePurchaseData, userId: string, userEmail: string) {
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.estimatedUnitPrice,
    0,
  );

  const purchase = await prisma.purchaseRequest.create({
    data: {
      code: generateCode('REQ'),
      title: data.title,
      department: data.department,
      priority: data.priority,
      justification: data.justification,
      totalAmount,
      notes: data.notes,
      createdById: userId,
      items: {
        create: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          estimatedUnitPrice: item.estimatedUnitPrice,
          totalPrice: item.quantity * item.estimatedUnitPrice,
        })),
      },
    },
    include: { items: true, creator: { select: { id: true, displayName: true } } },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'PURCHASE_CREATED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
    metadata: { code: purchase.code, totalAmount },
  });

  return purchase;
}

/**
 * Editing is only permitted while the request is still DRAFT — once
 * submitted, the items are part of the audit trail. When `items` are
 * passed we replace them wholesale (delete + createMany) and recompute
 * `totalAmount`; partial item edits aren't supported and would require
 * a different endpoint.
 */
export async function updatePurchase(
  id: string,
  data: UpdatePurchaseData,
  userId: string,
  userEmail: string,
  userRole: string,
) {
  const purchase = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchase) {
    return { error: 'NOT_FOUND' as const };
  }

  if (purchase.status !== 'DRAFT') {
    return { error: 'NOT_DRAFT' as const };
  }

  if (purchase.createdById !== userId && userRole !== 'ADMIN') {
    return { error: 'FORBIDDEN' as const };
  }

  let totalAmount: any = purchase.totalAmount;

  if (data.items && Array.isArray(data.items)) {
    await prisma.purchaseItem.deleteMany({ where: { purchaseRequestId: purchase.id } });
    totalAmount = data.items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.estimatedUnitPrice,
      0,
    );

    await prisma.purchaseItem.createMany({
      data: data.items.map((item: any) => ({
        purchaseRequestId: purchase.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'UN',
        estimatedUnitPrice: item.estimatedUnitPrice,
        totalPrice: item.quantity * item.estimatedUnitPrice,
      })),
    });
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.department && { department: data.department }),
      ...(data.priority && { priority: data.priority }),
      ...(data.justification && { justification: data.justification }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.items && { totalAmount }),
    },
    include: {
      items: true,
      creator: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'PURCHASE_UPDATED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
    metadata: { code: purchase.code },
  });

  return { data: updated };
}
