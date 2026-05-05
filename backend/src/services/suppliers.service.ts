import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { createAuditLog } from './audit.service.js';
import logger from '../utils/logger.js';

// ==================== TYPES ====================

export interface SupplierFilters {
  search?: string;
  isActive?: boolean;
}

export interface SupplierPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface CreateSupplierData {
  name: string;
  email?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierData {
  name?: string;
  email?: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// ==================== QUERIES ====================

export async function listSuppliers(filters: SupplierFilters, pagination: SupplierPagination) {
  const where: any = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { cnpj: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    data: suppliers,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { purchaseOrders: true } },
      purchaseOrders: {
        select: { totalAmount: true },
      },
    },
  });

  if (!supplier) return { error: 'NOT_FOUND' as const };

  const totalAmount = supplier.purchaseOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0,
  );

  const { purchaseOrders, ...supplierData } = supplier;

  return { data: { ...supplierData, totalAmount } };
}

// ==================== MUTATIONS ====================

export async function createSupplier(
  data: CreateSupplierData,
  actorId: string,
  actorEmail: string,
) {
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: requireTenantId(),
      name: data.name,
      email: data.email,
      cnpj: data.cnpj,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    },
  });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'SUPPLIER_CREATED',
    entityType: 'SUPPLIER',
    entityId: supplier.id,
    metadata: { name: supplier.name },
  });

  return { data: supplier };
}

export async function updateSupplier(
  id: string,
  data: UpdateSupplierData,
  actorId: string,
  actorEmail: string,
) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) return { error: 'NOT_FOUND' as const };

  const supplier = await prisma.supplier.update({
    where: { id },
    data,
  });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'SUPPLIER_UPDATED',
    entityType: 'SUPPLIER',
    entityId: supplier.id,
    metadata: { name: supplier.name },
  });

  return { data: supplier };
}

export async function archiveSupplier(id: string, actorId: string, actorEmail: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return { error: 'NOT_FOUND' as const };

  const pendingOrders = await prisma.purchaseOrder.count({
    where: {
      supplierId: id,
      purchaseRequest: {
        status: { in: ['DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'APPROVED'] },
      },
    },
  });

  if (pendingOrders > 0) return { error: 'HAS_PENDING_ORDERS' as const };

  const updated = await prisma.supplier.update({
    where: { id },
    data: { isActive: false },
  });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'SUPPLIER_ARCHIVED',
    entityType: 'SUPPLIER',
    entityId: supplier.id,
    metadata: { name: supplier.name },
  });

  return { data: updated };
}

export async function listSupplierOrders(id: string, pagination: SupplierPagination) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return { error: 'NOT_FOUND' as const };

  const where = { supplierId: id };

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        purchaseRequest: {
          select: { id: true, code: true, title: true, status: true, priority: true },
        },
      },
      orderBy: { executedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    data: orders,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}
