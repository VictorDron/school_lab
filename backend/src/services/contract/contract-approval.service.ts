import { prisma } from '../../config/database.js';
import {
  GateApprovalDecision,
  UserRole,
} from '@prisma/client';
import * as ApprovalTaskService from '../approval-task.service.js';
import { generateContractDocument } from './contract-pdf.service.js';
import logger from '../../utils/logger.js';
import { createAppError } from '../../lib/error-messages.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';
import { contractInclude } from './contract-core.service.js';

/**
 * Syncs a contract approval decision to the corresponding AdmissionGateApproval
 * record (CONTRACT_PENDING gate step), so that the pendency system stays in sync
 * with contract-level approvals.
 */
async function syncGateApproval(
  leadId: string,
  department: 'LEGAL' | 'FINANCE',
  decision: GateApprovalDecision,
  userId: string,
  notes?: string,
) {
  try {
    const gateApproval = await prisma.admissionGateApproval.findUnique({
      where: {
        leadId_gateStep_department: {
          leadId,
          gateStep: 'CONTRACT_PENDING',
          department,
        },
      },
    });

    if (!gateApproval || gateApproval.decision !== 'PENDING') return;

    await prisma.admissionGateApproval.update({
      where: { id: gateApproval.id },
      data: {
        decision,
        decidedById: userId,
        notes: notes ?? null,
        decidedAt: new Date(),
      },
    });

    // Complete the linked approval task
    await ApprovalTaskService.completeApprovalTask(gateApproval.id, decision);

    logger.info(`Synced contract ${department} approval to gate approval`, {
      leadId,
      gateApprovalId: gateApproval.id,
      decision,
    });
  } catch (err) {
    logger.warn(`Failed to sync contract ${department} approval to gate approval`, {
      leadId,
      error: (err as Error).message,
    });
  }
}

/**
 * Records a legal department approval decision on a contract.
 * Defense-in-depth: enforces LEGAL or ADMIN role even if the route guard is bypassed.
 * @throws Error('INSUFFICIENT_ROLE') if callerRole is not LEGAL or ADMIN
 */
export async function submitLegalApproval(
  contractId: string,
  decision: GateApprovalDecision,
  userId: string,
  callerRole: UserRole,
  notes?: string,
) {
  if (!(['LEGAL', 'ADMIN'] as UserRole[]).includes(callerRole)) {
    throw createAppError('INSUFFICIENT_ROLE');
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (contract.status !== 'PENDING_LEGAL') throw createAppError('CONTRACT_INVALID_STATUS');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      legalApprovalStatus: decision,
      legalApprovedById: userId,
      legalApprovedAt: new Date(),
      legalNotes: notes ?? null,
      // Advance contract status based on legal decision
      ...(decision === 'APPROVED' ? { status: 'PENDING_FINANCIAL' as const } : {}),
      ...(decision === 'REJECTED' ? { status: 'CANCELLED' as const, cancelledAt: new Date(), cancellationReason: notes ?? 'Rejeitado pelo jurídico' } : {}),
    },
    include: contractInclude,
  });

  // Record history
  await prisma.leadHistory.create({
    data: {
      leadId: contract.leadId,
      action: 'CONTRACT_LEGAL_APPROVAL',
      actorId: userId,
      details: { contractId, decision, notes },
    },
  });

  // Sync: resolve the corresponding gate approval (CONTRACT_PENDING + LEGAL)
  await syncGateApproval(contract.leadId, 'LEGAL', decision, userId, notes);

  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:updated', leadId: contract.leadId }));
    getIO().to(`lead:${contract.leadId}`).emit('crm:lead:updated', { leadId: contract.leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return updated;
}

/**
 * Records a financial department approval decision on a contract.
 * If both legal and financial are approved, auto-generates the PDF and attempts to advance the admission gate.
 * Defense-in-depth: enforces FINANCE or ADMIN role even if the route guard is bypassed.
 * @throws Error('INSUFFICIENT_ROLE') if callerRole is not FINANCE or ADMIN
 */
export async function submitFinancialApproval(
  contractId: string,
  decision: GateApprovalDecision,
  userId: string,
  callerRole: UserRole,
  notes?: string,
) {
  if (!(['FINANCE', 'ADMIN'] as UserRole[]).includes(callerRole)) {
    throw createAppError('INSUFFICIENT_ROLE');
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });
  if (!contract) throw createAppError('CONTRACT_NOT_FOUND');
  if (contract.status !== 'PENDING_FINANCIAL') throw createAppError('CONTRACT_INVALID_STATUS');
  if (contract.legalApprovalStatus !== 'APPROVED') throw createAppError('CONTRACT_LEGAL_NOT_APPROVED');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      financialApprovalStatus: decision,
      financialApprovedById: userId,
      financialApprovedAt: new Date(),
      financialNotes: notes ?? null,
      // When rejected, cancel the contract
      ...(decision === 'REJECTED' ? { status: 'CANCELLED' as const, cancelledAt: new Date(), cancellationReason: notes ?? 'Rejeitado pelo financeiro' } : {}),
    },
    include: contractInclude,
  });

  // Record history
  await prisma.leadHistory.create({
    data: {
      leadId: contract.leadId,
      action: 'CONTRACT_FINANCIAL_APPROVAL',
      actorId: userId,
      details: { contractId, decision, notes },
    },
  });

  // Sync: resolve the corresponding gate approval (CONTRACT_PENDING + FINANCE)
  await syncGateApproval(contract.leadId, 'FINANCE', decision, userId, notes);

  // If both legal and financial are approved, auto-generate the PDF
  if (
    decision === 'APPROVED' &&
    updated.legalApprovalStatus === 'APPROVED'
  ) {
    try {
      if (!updated.documentUrl) {
        logger.info('Auto-generating contract PDF after both approvals', { contractId });
        await generateContractDocument(contractId);
      }
    } catch (err) {
      logger.warn('Auto-generation of contract PDF failed', { contractId, error: (err as Error).message });
    }
  }

  try {
    await redis.publish('crm:leads:list', JSON.stringify({ type: 'contract:updated', leadId: contract.leadId }));
    getIO().to(`lead:${contract.leadId}`).emit('crm:lead:updated', { leadId: contract.leadId });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return updated;
}
