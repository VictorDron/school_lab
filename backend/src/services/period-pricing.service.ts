import { prisma } from '../config/database.js';
import { requireTenantId, withTenantTx } from '../lib/tenant-context.js';
import { createAppError } from '../lib/error-messages.js';
import logger from '../utils/logger.js';

function toNum(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber();
  }
  return Number(val) || null;
}

// Statuses that allow price table/adjustment modifications
const EDITABLE_STATUSES = new Set(['DRAFT', 'OPEN']);

// Statuses that allow family price exception modifications (more permissive)
const EXCEPTION_EDITABLE_STATUSES = new Set(['DRAFT', 'OPEN', 'CLOSED']);

/**
 * Guard: throws if period is not in an editable status (DRAFT or OPEN).
 */
async function assertPeriodEditable(periodId: string): Promise<void> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { status: true },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  if (!EDITABLE_STATUSES.has(period.status)) {
    throw createAppError('PERIOD_PRICE_LOCKED');
  }
}

/**
 * Guard: throws if period is FINALIZED (exceptions can be edited until then).
 */
async function assertExceptionEditable(periodId: string): Promise<void> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { status: true },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  if (!EXCEPTION_EDITABLE_STATUSES.has(period.status)) {
    throw createAppError('PERIOD_PRICE_LOCKED');
  }
}

// ── Pure calculation functions (no DB) ──────────────────────────────

export function calculateProposedValue(params: {
  baseAnnualValue: number;
  adjustmentPercent: number;
  exception?: {
    overrideAnnualValue?: number | null;
    overrideDiscountPercent?: number | null;
  };
}): { proposedValue: number; finalValue: number; monthlyValue: number } {
  const { baseAnnualValue, adjustmentPercent, exception } = params;

  const proposedValue = Math.round(baseAnnualValue * (1 + adjustmentPercent / 100) * 100) / 100;

  let finalValue: number;

  if (exception?.overrideAnnualValue != null) {
    finalValue = exception.overrideAnnualValue;
  } else if (exception?.overrideDiscountPercent != null) {
    finalValue = Math.round(proposedValue * (1 - exception.overrideDiscountPercent / 100) * 100) / 100;
  } else {
    finalValue = proposedValue;
  }

  const monthlyValue = Math.round((finalValue / 12) * 100) / 100;

  return { proposedValue, finalValue, monthlyValue };
}

export function getFinancialStatus(
  payments: Array<{ status: string }>
): 'ADIMPLENTE' | 'INADIMPLENTE' | 'SEM_CONTRATO' {
  if (!payments || payments.length === 0) return 'SEM_CONTRATO';
  return payments.some((p) => p.status === 'OVERDUE') ? 'INADIMPLENTE' : 'ADIMPLENTE';
}

// ── CRUD: Price Table ───────────────────────────────────────────────

export interface PriceTableEntryInput {
  grade: string;
  baseAnnualValue: number;
  enrollmentFee: number;
  discountPercent: number | null;
}

export async function upsertPriceTable(periodId: string, entries: PriceTableEntryInput[]) {
  await assertPeriodEditable(periodId);

  const tenantId = requireTenantId();
  await withTenantTx(prisma, async (tx) => {
    await tx.periodPriceTable.deleteMany({ where: { periodId } });
    await tx.periodPriceTable.createMany({
      data: entries.map((e) => ({
        tenantId,
        periodId,
        grade: e.grade,
        baseAnnualValue: e.baseAnnualValue,
        enrollmentFee: e.enrollmentFee,
        discountPercent: e.discountPercent,
      })),
    });
  });
}

export async function getPriceTable(periodId: string) {
  return prisma.periodPriceTable.findMany({
    where: { periodId },
    orderBy: { grade: 'asc' },
  });
}

// ── CRUD: Family Price Exception ────────────────────────────────────

export interface ExceptionInput {
  overrideAnnualValue?: number | null;
  overrideDiscountPercent?: number | null;
  justification: string;
}

/**
 * Determines if a discount change requires FINANCE approval.
 * Rule: increasing discount requires approval; decreasing does not.
 * ADMIN users always auto-approve.
 */
async function resolveApprovalStatus(
  newDiscount: number | null | undefined,
  previousDiscount: number | null,
  userId: string,
): Promise<{ approvalStatus: string; previousDiscountPercent: number | null }> {
  const newVal = newDiscount ?? 0;
  const prevVal = previousDiscount ?? 0;

  // Discount not increasing → auto-approve
  if (newVal <= prevVal) {
    return { approvalStatus: 'APPROVED', previousDiscountPercent: previousDiscount };
  }

  // Check if user is ADMIN → auto-approve
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === 'ADMIN') {
    return { approvalStatus: 'APPROVED', previousDiscountPercent: previousDiscount };
  }

  // Discount increasing + non-ADMIN → requires FINANCE approval
  return { approvalStatus: 'PENDING', previousDiscountPercent: previousDiscount };
}

/**
 * Notify FINANCE users about a pending discount approval.
 */
async function notifyFinanceApproval(exceptionId: string, studentName: string, periodName: string) {
  try {
    const financeUsers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'FINANCE', 'DIRECTOR'] }, status: 'ACTIVE' },
      select: { id: true },
    });

    if (financeUsers.length === 0) return;

    const { createBulkNotifications } = await import('./notification.service.js');
    await createBulkNotifications(
      financeUsers.map((u) => u.id),
      {
        type: 'exception_approval_required',
        title: 'Aprovação de Desconto Pendente',
        message: `Desconto para ${studentName} na campanha "${periodName}" aguarda aprovação financeira.`,
        data: { exceptionId },
      },
    );
  } catch (err) {
    logger.warn('Failed to notify finance about exception approval', {
      exceptionId,
      error: (err as Error).message,
    });
  }
}

export async function createException(
  periodId: string,
  studentId: string,
  data: ExceptionInput,
  createdById: string
) {
  await assertExceptionEditable(periodId);

  const { approvalStatus, previousDiscountPercent } = await resolveApprovalStatus(
    data.overrideDiscountPercent,
    null,
    createdById,
  );

  const exception = await prisma.familyPriceException.create({
    data: {
      tenantId: requireTenantId(),
      periodId,
      studentId,
      overrideAnnualValue: data.overrideAnnualValue ?? undefined,
      overrideDiscountPercent: data.overrideDiscountPercent ?? undefined,
      previousDiscountPercent,
      justification: data.justification,
      approvalStatus,
      createdById,
    },
    include: { student: { select: { fullName: true } }, period: { select: { name: true } } },
  });

  if (approvalStatus === 'PENDING') {
    await notifyFinanceApproval(exception.id, exception.student.fullName, exception.period.name);
  }

  return exception;
}

export async function updateException(exceptionId: string, data: Partial<ExceptionInput>, userId?: string) {
  const existing = await prisma.familyPriceException.findUnique({
    where: { id: exceptionId },
    select: { periodId: true, overrideDiscountPercent: true },
  });
  if (!existing) throw createAppError('EXCEPTION_NOT_FOUND');
  await assertExceptionEditable(existing.periodId);

  const previousDiscount = toNum(existing.overrideDiscountPercent);
  const approvalFields: Record<string, unknown> = {};

  if (data.overrideDiscountPercent !== undefined && userId) {
    const { approvalStatus, previousDiscountPercent } = await resolveApprovalStatus(
      data.overrideDiscountPercent,
      previousDiscount,
      userId,
    );
    approvalFields.approvalStatus = approvalStatus;
    approvalFields.previousDiscountPercent = previousDiscountPercent;
    // Reset approval fields if going back to PENDING
    if (approvalStatus === 'PENDING') {
      approvalFields.approvedById = null;
      approvalFields.approvalNotes = null;
      approvalFields.approvalDecidedAt = null;
    }
  }

  const updated = await prisma.familyPriceException.update({
    where: { id: exceptionId },
    data: {
      ...(data.overrideAnnualValue !== undefined && { overrideAnnualValue: data.overrideAnnualValue }),
      ...(data.overrideDiscountPercent !== undefined && { overrideDiscountPercent: data.overrideDiscountPercent }),
      ...(data.justification !== undefined && { justification: data.justification }),
      ...approvalFields,
    },
    include: { student: { select: { fullName: true } }, period: { select: { name: true } } },
  });

  if (approvalFields.approvalStatus === 'PENDING') {
    await notifyFinanceApproval(updated.id, updated.student.fullName, updated.period.name);
  }

  return updated;
}

export async function deleteException(exceptionId: string) {
  const existing = await prisma.familyPriceException.findUnique({
    where: { id: exceptionId },
    select: { periodId: true },
  });
  if (!existing) throw createAppError('EXCEPTION_NOT_FOUND');
  await assertExceptionEditable(existing.periodId);

  return prisma.familyPriceException.delete({
    where: { id: exceptionId },
  });
}

// ── Exception Approval ─────────────────────────────────────────────

export async function submitExceptionApproval(
  exceptionId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes: string | undefined,
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Only ADMIN, FINANCE, DIRECTOR can approve
  const allowedRoles = new Set(['ADMIN', 'FINANCE', 'DIRECTOR']);
  if (!user || !allowedRoles.has(user.role)) {
    throw createAppError('UNAUTHORIZED', 'Apenas financeiro ou administrador pode aprovar descontos.');
  }

  const exception = await prisma.familyPriceException.findUnique({
    where: { id: exceptionId },
    select: { approvalStatus: true },
  });
  if (!exception) throw createAppError('EXCEPTION_NOT_FOUND');
  if (exception.approvalStatus !== 'PENDING') {
    throw createAppError('EXCEPTION_ALREADY_DECIDED', 'Esta exceção já foi decidida.');
  }

  return prisma.familyPriceException.update({
    where: { id: exceptionId },
    data: {
      approvalStatus: decision,
      approvedById: userId,
      approvalNotes: notes ?? null,
      approvalDecidedAt: new Date(),
    },
  });
}

export async function listPendingExceptionApprovals(periodId?: string) {
  return prisma.familyPriceException.findMany({
    where: {
      approvalStatus: 'PENDING',
      ...(periodId ? { periodId } : {}),
    },
    include: {
      student: { select: { fullName: true, grade: true, code: true } },
      period: { select: { name: true } },
      createdBy: { select: { displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ── Adjustment Percent ──────────────────────────────────────────────

export async function updateAdjustmentPercent(periodId: string, percent: number) {
  await assertPeriodEditable(periodId);

  return prisma.reEnrollmentPeriod.update({
    where: { id: periodId },
    data: { adjustmentPercent: percent },
  });
}
