import { prisma } from '../../config/database.js';
import { AdmissionGateStatus } from '@prisma/client';
import { createAppError } from '../../lib/error-messages.js';

/**
 * EVALUATION_COMPLETED requires every applicant child to have at least one
 * decided (non-PENDING) experience evaluation.
 */
export async function assertEvaluationComplete(
  leadId: string,
  newStatus: AdmissionGateStatus,
): Promise<void> {
  if (newStatus !== 'EVALUATION_COMPLETED') return;

  const children = await prisma.leadChild.findMany({
    where: { leadId },
    select: { id: true, fullName: true },
  });

  if (children.length === 0) {
    throw createAppError('EVALUATION_INCOMPLETE');
  }

  const evaluations = await prisma.experienceEvaluation.findMany({
    where: { leadId },
    select: { childId: true, decision: true },
  });

  for (const child of children) {
    const childEvals = evaluations.filter((e) => e.childId === child.id);
    const hasDecidedEval = childEvals.some((e) => e.decision !== 'PENDING');
    if (!hasDecidedEval) {
      throw createAppError('EVALUATION_INCOMPLETE');
    }
  }
}

/**
 * If the target gate has GateStepConfig records, every required approval
 * must be APPROVED before the transition is allowed. When approvals don't
 * exist yet, creates them and blocks. Skipped when force=true.
 */
export async function assertGateApproved(
  leadId: string,
  newStatus: AdmissionGateStatus,
  userId: string,
  force: boolean,
): Promise<void> {
  if (force) return;

  const gateConfigs = await prisma.gateStepConfig.findMany({
    where: { gateStep: newStatus },
  });

  if (gateConfigs.length === 0) return;

  const approvals = await prisma.admissionGateApproval.findMany({
    where: { leadId, gateStep: newStatus, isRequired: true },
  });

  if (approvals.length === 0) {
    // Approvals not yet created — create them now and block
    try {
      const GateApprovalService = await import('../gate-approval.service.js');
      await GateApprovalService.createApprovalsForGate(leadId, newStatus, userId);
    } catch {
      /* config may not exist */
    }
    throw createAppError('GATE_PENDING_APPROVALS');
  }

  const allApproved = approvals.every((a) => a.decision === 'APPROVED');
  if (!allApproved) {
    throw createAppError('GATE_PENDING_APPROVALS');
  }
}
