import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { Prisma, SchoolInvoiceStatus, SchoolInvoiceType, PayableStatus, PayableCategory } from '@prisma/client';

// ==================== TUITIONS ====================

export interface CreateTuitionData {
  grade: string;
  year: number;
  monthlyAmount: number;
  materialAmount?: number;
  enrollmentFee?: number;
  notes?: string;
}

export interface UpdateTuitionData extends Partial<CreateTuitionData> {
  isActive?: boolean;
}

export async function listTuitions(filters: { year?: number } = {}) {
  const tenantId = requireTenantId();
  return prisma.tuition.findMany({
    where: {
      tenantId,
      ...(filters.year !== undefined && { year: filters.year }),
    },
    orderBy: [{ year: 'desc' }, { grade: 'asc' }],
  });
}

export async function createTuition(data: CreateTuitionData) {
  const tenantId = requireTenantId();
  return prisma.tuition.create({
    data: {
      tenantId,
      grade: data.grade.trim(),
      year: data.year,
      monthlyAmount: new Prisma.Decimal(data.monthlyAmount),
      materialAmount: data.materialAmount !== undefined ? new Prisma.Decimal(data.materialAmount) : null,
      enrollmentFee: data.enrollmentFee !== undefined ? new Prisma.Decimal(data.enrollmentFee) : null,
      notes: data.notes?.trim() || null,
    },
  });
}

export async function updateTuition(id: string, data: UpdateTuitionData) {
  const tenantId = requireTenantId();
  const existing = await prisma.tuition.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.tuition.update({
    where: { id },
    data: {
      ...(data.grade !== undefined && { grade: data.grade.trim() }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.monthlyAmount !== undefined && { monthlyAmount: new Prisma.Decimal(data.monthlyAmount) }),
      ...(data.materialAmount !== undefined && { materialAmount: data.materialAmount === null ? null : new Prisma.Decimal(data.materialAmount) }),
      ...(data.enrollmentFee !== undefined && { enrollmentFee: data.enrollmentFee === null ? null : new Prisma.Decimal(data.enrollmentFee) }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deleteTuition(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.tuition.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.tuition.delete({ where: { id } });
  return existing;
}

// ==================== INVOICES ====================

export interface CreateInvoiceData {
  studentId?: string;
  type: SchoolInvoiceType;
  description: string;
  amount: number;
  dueDate: Date;
  notes?: string;
}

export interface UpdateInvoiceData extends Partial<Omit<CreateInvoiceData, 'studentId'>> {
  status?: SchoolInvoiceStatus;
  studentId?: string | null;
}

const invoiceInclude = {
  student:   { select: { id: true, fullName: true, code: true, grade: true } },
  createdBy: { select: { id: true, displayName: true } },
} as const;

export async function listInvoices(filters: { status?: SchoolInvoiceStatus; studentId?: string; type?: SchoolInvoiceType } = {}) {
  const tenantId = requireTenantId();

  // Sweep overdue: anything PENDING with dueDate < today gets flipped.
  await prisma.schoolInvoice.updateMany({
    where: {
      tenantId,
      status: 'PENDING',
      dueDate: { lt: startOfToday() },
    },
    data: { status: 'OVERDUE' },
  });

  return prisma.schoolInvoice.findMany({
    where: {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.type && { type: filters.type }),
    },
    include: invoiceInclude,
    orderBy: [{ dueDate: 'asc' }],
  });
}

export async function createInvoice(data: CreateInvoiceData, createdById: string) {
  const tenantId = requireTenantId();
  return prisma.schoolInvoice.create({
    data: {
      tenantId,
      studentId: data.studentId || null,
      type: data.type,
      description: data.description.trim(),
      amount: new Prisma.Decimal(data.amount),
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      createdById,
    },
    include: invoiceInclude,
  });
}

export async function updateInvoice(id: string, data: UpdateInvoiceData) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolInvoice.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  return prisma.schoolInvoice.update({
    where: { id },
    data: {
      ...(data.studentId !== undefined && { studentId: data.studentId }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.amount !== undefined && { amount: new Prisma.Decimal(data.amount) }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: invoiceInclude,
  });
}

export async function markInvoicePaid(id: string, paidAmount?: number) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolInvoice.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.schoolInvoice.update({
    where: { id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paidAmount: new Prisma.Decimal(paidAmount ?? Number(existing.amount)),
    },
    include: invoiceInclude,
  });
}

export async function deleteInvoice(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolInvoice.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.schoolInvoice.delete({ where: { id } });
  return existing;
}

// ==================== PAYABLES ====================

export interface CreatePayableData {
  supplierName: string;
  description: string;
  category: PayableCategory;
  amount: number;
  dueDate: Date;
  notes?: string;
  attachmentUrl?: string;
}

export interface UpdatePayableData extends Partial<CreatePayableData> {
  status?: PayableStatus;
}

const payableInclude = {
  createdBy: { select: { id: true, displayName: true } },
} as const;

export async function listPayables(filters: { status?: PayableStatus; category?: PayableCategory } = {}) {
  const tenantId = requireTenantId();

  await prisma.accountsPayable.updateMany({
    where: { tenantId, status: 'PENDING', dueDate: { lt: startOfToday() } },
    data: { status: 'OVERDUE' },
  });

  return prisma.accountsPayable.findMany({
    where: {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.category && { category: filters.category }),
    },
    include: payableInclude,
    orderBy: [{ dueDate: 'asc' }],
  });
}

export async function createPayable(data: CreatePayableData, createdById: string) {
  const tenantId = requireTenantId();
  return prisma.accountsPayable.create({
    data: {
      tenantId,
      supplierName: data.supplierName.trim(),
      description: data.description.trim(),
      category: data.category,
      amount: new Prisma.Decimal(data.amount),
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      attachmentUrl: data.attachmentUrl?.trim() || null,
      createdById,
    },
    include: payableInclude,
  });
}

export async function updatePayable(id: string, data: UpdatePayableData) {
  const tenantId = requireTenantId();
  const existing = await prisma.accountsPayable.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.accountsPayable.update({
    where: { id },
    data: {
      ...(data.supplierName !== undefined && { supplierName: data.supplierName.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.amount !== undefined && { amount: new Prisma.Decimal(data.amount) }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.attachmentUrl !== undefined && { attachmentUrl: data.attachmentUrl?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: payableInclude,
  });
}

export async function markPayablePaid(id: string, paidAmount?: number) {
  const tenantId = requireTenantId();
  const existing = await prisma.accountsPayable.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.accountsPayable.update({
    where: { id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      paidAmount: new Prisma.Decimal(paidAmount ?? Number(existing.amount)),
    },
    include: payableInclude,
  });
}

export async function deletePayable(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.accountsPayable.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.accountsPayable.delete({ where: { id } });
  return existing;
}

// ==================== CASH FLOW ====================

/**
 * Aggregates AR (school invoices) and AP (accounts payable) for the
 * dashboard. Returns totals by status and a 6-month upcoming view.
 */
export async function getCashFlow() {
  const tenantId = requireTenantId();
  const now = new Date();
  const sixMonthsFromNow = new Date(now);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const [invoiceAgg, payableAgg, upcomingInvoices, upcomingPayables] = await Promise.all([
    prisma.schoolInvoice.groupBy({
      by: ['status'],
      where: { tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.accountsPayable.groupBy({
      by: ['status'],
      where: { tenantId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.schoolInvoice.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lte: sixMonthsFromNow },
      },
      select: { id: true, description: true, amount: true, dueDate: true, status: true, student: { select: { fullName: true } } },
      orderBy: { dueDate: 'asc' },
      take: 30,
    }),
    prisma.accountsPayable.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'OVERDUE'] },
        dueDate: { lte: sixMonthsFromNow },
      },
      select: { id: true, supplierName: true, description: true, amount: true, dueDate: true, status: true, category: true },
      orderBy: { dueDate: 'asc' },
      take: 30,
    }),
  ]);

  return {
    receivables: rollUp(invoiceAgg),
    payables: rollUp(payableAgg),
    upcomingInvoices,
    upcomingPayables,
  };
}

function rollUp(agg: Array<{ status: string; _sum: { amount: Prisma.Decimal | null }; _count: { _all: number } }>) {
  const init = { PENDING: 0, PAID: 0, OVERDUE: 0, CANCELLED: 0 };
  const out: { totalsByStatus: typeof init; countsByStatus: typeof init; total: number; net: number } = {
    totalsByStatus: { ...init },
    countsByStatus: { ...init },
    total: 0,
    net: 0,
  };
  for (const row of agg) {
    const amount = Number(row._sum.amount ?? 0);
    if (row.status in out.totalsByStatus) {
      out.totalsByStatus[row.status as keyof typeof init] = amount;
      out.countsByStatus[row.status as keyof typeof init] = row._count._all;
    }
    out.total += amount;
  }
  out.net = out.totalsByStatus.PAID;
  return out;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
