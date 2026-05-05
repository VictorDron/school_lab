import { PurchaseStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { createAuditLog } from '../audit.service.js';
import { createNotification } from '../notification.service.js';

export async function submitPurchase(id: string, userId: string, userEmail: string) {
  const purchase = await prisma.purchaseRequest.findUnique({ where: { id } });

  if (!purchase) {
    return { error: 'NOT_FOUND' as const };
  }

  if (purchase.status !== 'DRAFT') {
    return { error: 'NOT_DRAFT' as const };
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: 'PENDING_MANAGER', submittedAt: new Date() },
  });

  await prisma.approvalAction.create({
    data: {
      purchaseRequestId: purchase.id,
      userId,
      action: 'SUBMITTED',
      previousStatus: 'DRAFT',
      newStatus: 'PENDING_MANAGER',
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'PURCHASE_SUBMITTED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
  });

  return { data: updated };
}

/**
 * Two-stage approval: PENDING_MANAGER → PENDING_FINANCE → APPROVED.
 * The first "approve" promotes to PENDING_FINANCE; the second flips to
 * APPROVED. A "reject" at any stage terminates the chain. Notifying
 * the creator with sendEmail=true also triggers a transactional email.
 */
export async function approvePurchase(
  id: string,
  action: 'approve' | 'reject',
  comments: string | undefined,
  userId: string,
  userEmail: string,
) {
  const purchase = await prisma.purchaseRequest.findUnique({ where: { id } });

  if (!purchase) {
    return { error: 'NOT_FOUND' as const };
  }

  let newStatus: PurchaseStatus;
  if (action === 'approve') {
    newStatus = purchase.status === 'PENDING_MANAGER' ? 'PENDING_FINANCE' : 'APPROVED';
  } else {
    newStatus = 'REJECTED';
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approvedAt: newStatus === 'APPROVED' ? new Date() : undefined,
      rejectedAt: newStatus === 'REJECTED' ? new Date() : undefined,
    },
  });

  await prisma.approvalAction.create({
    data: {
      purchaseRequestId: purchase.id,
      userId,
      action: action.toUpperCase(),
      comments,
      previousStatus: purchase.status,
      newStatus,
    },
  });

  await createNotification({
    userId: purchase.createdById,
    type: 'purchase_status',
    title: action === 'approve' ? 'Requisição Aprovada' : 'Requisição Rejeitada',
    message: `Sua requisição "${purchase.title}" foi ${action === 'approve' ? 'aprovada' : 'rejeitada'}.`,
    data: { purchaseId: purchase.id, purchaseCode: purchase.code },
    sendEmail: true,
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: action === 'approve' ? 'PURCHASE_APPROVED' : 'PURCHASE_REJECTED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
  });

  return { data: updated };
}

/**
 * Cancel a request. Only DRAFT, PENDING_MANAGER, and PENDING_FINANCE
 * are cancellable — once APPROVED, cancellation requires the executor
 * flow because a downstream PurchaseOrder may already exist.
 */
export async function cancelPurchase(
  id: string,
  reason: string | undefined,
  userId: string,
  userEmail: string,
  userRole: string,
) {
  const purchase = await prisma.purchaseRequest.findUnique({ where: { id } });

  if (!purchase) {
    return { error: 'NOT_FOUND' as const };
  }

  const cancellableStatuses: PurchaseStatus[] = ['DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE'];
  if (!cancellableStatuses.includes(purchase.status)) {
    return { error: 'NOT_CANCELLABLE' as const };
  }

  if (purchase.createdById !== userId && userRole !== 'ADMIN') {
    return { error: 'FORBIDDEN' as const };
  }

  const updated = await prisma.purchaseRequest.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  await prisma.approvalAction.create({
    data: {
      purchaseRequestId: purchase.id,
      userId,
      action: 'CANCELLED',
      comments: reason,
      previousStatus: purchase.status,
      newStatus: 'CANCELLED',
    },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'PURCHASE_CANCELLED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
    metadata: { code: purchase.code, reason },
  });

  return { data: updated };
}
