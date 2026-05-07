import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as FinanceService from '../services/finance.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { SchoolInvoiceStatus, SchoolInvoiceType, PayableStatus, PayableCategory } from '@prisma/client';

// ==================== TUITIONS ====================

const tuitionSchema = z.object({
  grade: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  monthlyAmount: z.number().nonnegative(),
  materialAmount: z.number().nonnegative().optional(),
  enrollmentFee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export async function listTuitions(req: AuthenticatedRequest, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined;
  res.json({ success: true, data: await FinanceService.listTuitions({ year }) });
}

export async function createTuition(req: AuthenticatedRequest, res: Response) {
  const data = tuitionSchema.parse(req.body);
  const tuition = await FinanceService.createTuition(data);
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'TUITION_CREATED', entityType: 'TUITION', entityId: tuition.id, metadata: data },
    req,
  );
  res.status(201).json({ success: true, data: tuition });
}

export async function updateTuition(req: AuthenticatedRequest, res: Response) {
  const data = tuitionSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
  const tuition = await FinanceService.updateTuition(req.params.id, data);
  if (!tuition) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'TUITION_UPDATED', entityType: 'TUITION', entityId: tuition.id, metadata: data },
    req,
  );
  res.json({ success: true, data: tuition });
}

export async function deleteTuition(req: AuthenticatedRequest, res: Response) {
  const tuition = await FinanceService.deleteTuition(req.params.id);
  if (!tuition) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'TUITION_DELETED', entityType: 'TUITION', entityId: tuition.id },
    req,
  );
  res.json({ success: true });
}

// ==================== INVOICES ====================

const invoiceSchema = z.object({
  studentId: z.string().uuid().nullish(),
  type: z.enum(['TUITION', 'MATERIAL', 'ENROLLMENT_FEE', 'ACTIVITY', 'OTHER']),
  description: z.string().min(1),
  amount: z.number().nonnegative(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
});

const invoiceUpdateSchema = invoiceSchema.partial().extend({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
});

export async function listInvoices(req: AuthenticatedRequest, res: Response) {
  const filters = {
    status:    req.query.status    as SchoolInvoiceStatus | undefined,
    studentId: req.query.studentId as string | undefined,
    type:      req.query.type      as SchoolInvoiceType | undefined,
  };
  res.json({ success: true, data: await FinanceService.listInvoices(filters) });
}

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  const data = invoiceSchema.parse(req.body);
  const invoice = await FinanceService.createInvoice(
    {
      studentId: data.studentId ?? undefined,
      type: data.type,
      description: data.description,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      notes: data.notes,
    },
    req.user!.id,
  );
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'INVOICE_CREATED', entityType: 'INVOICE', entityId: invoice.id, metadata: { type: invoice.type, amount: invoice.amount } },
    req,
  );
  res.status(201).json({ success: true, data: invoice });
}

export async function updateInvoice(req: AuthenticatedRequest, res: Response) {
  const data = invoiceUpdateSchema.parse(req.body);
  const invoice = await FinanceService.updateInvoice(req.params.id, {
    studentId: data.studentId,
    type: data.type,
    description: data.description,
    amount: data.amount,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    notes: data.notes,
    status: data.status,
  });
  if (!invoice) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'INVOICE_UPDATED', entityType: 'INVOICE', entityId: invoice.id, metadata: data },
    req,
  );
  res.json({ success: true, data: invoice });
}

export async function markInvoicePaid(req: AuthenticatedRequest, res: Response) {
  const data = z.object({ paidAmount: z.number().nonnegative().optional() }).parse(req.body ?? {});
  const invoice = await FinanceService.markInvoicePaid(req.params.id, data.paidAmount);
  if (!invoice) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'INVOICE_PAID', entityType: 'INVOICE', entityId: invoice.id, metadata: { paidAmount: invoice.paidAmount } },
    req,
  );
  res.json({ success: true, data: invoice });
}

export async function deleteInvoice(req: AuthenticatedRequest, res: Response) {
  const invoice = await FinanceService.deleteInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'INVOICE_DELETED', entityType: 'INVOICE', entityId: invoice.id },
    req,
  );
  res.json({ success: true });
}

// ==================== PAYABLES ====================

const payableSchema = z.object({
  supplierName: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['RENT', 'UTILITIES', 'PAYROLL', 'SUPPLIES', 'SERVICES', 'TAXES', 'OTHER']),
  amount: z.number().nonnegative(),
  dueDate: z.string().datetime(),
  notes: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

const payableUpdateSchema = payableSchema.partial().extend({
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
});

export async function listPayables(req: AuthenticatedRequest, res: Response) {
  const filters = {
    status:   req.query.status   as PayableStatus | undefined,
    category: req.query.category as PayableCategory | undefined,
  };
  res.json({ success: true, data: await FinanceService.listPayables(filters) });
}

export async function createPayable(req: AuthenticatedRequest, res: Response) {
  const data = payableSchema.parse(req.body);
  const payable = await FinanceService.createPayable(
    { ...data, dueDate: new Date(data.dueDate) },
    req.user!.id,
  );
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'PAYABLE_CREATED', entityType: 'PAYABLE', entityId: payable.id, metadata: { supplier: payable.supplierName, amount: payable.amount } },
    req,
  );
  res.status(201).json({ success: true, data: payable });
}

export async function updatePayable(req: AuthenticatedRequest, res: Response) {
  const data = payableUpdateSchema.parse(req.body);
  const payable = await FinanceService.updatePayable(req.params.id, {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
  });
  if (!payable) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'PAYABLE_UPDATED', entityType: 'PAYABLE', entityId: payable.id, metadata: data },
    req,
  );
  res.json({ success: true, data: payable });
}

export async function markPayablePaid(req: AuthenticatedRequest, res: Response) {
  const data = z.object({ paidAmount: z.number().nonnegative().optional() }).parse(req.body ?? {});
  const payable = await FinanceService.markPayablePaid(req.params.id, data.paidAmount);
  if (!payable) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'PAYABLE_PAID', entityType: 'PAYABLE', entityId: payable.id, metadata: { paidAmount: payable.paidAmount } },
    req,
  );
  res.json({ success: true, data: payable });
}

export async function deletePayable(req: AuthenticatedRequest, res: Response) {
  const payable = await FinanceService.deletePayable(req.params.id);
  if (!payable) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    { actorId: req.user!.id, actorEmail: req.user!.email, action: 'PAYABLE_DELETED', entityType: 'PAYABLE', entityId: payable.id },
    req,
  );
  res.json({ success: true });
}

// ==================== CASH FLOW ====================

export async function getCashFlow(_req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, data: await FinanceService.getCashFlow() });
}
