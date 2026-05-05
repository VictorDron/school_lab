import { prisma } from '../../config/database.js';
import {
  AdmissionGateStatus,
  AdmissionDepartment,
  GateApprovalDecision,
} from '@prisma/client';
import * as AdmissionGateService from '../admission-gate.service.js';
import * as ApprovalTaskService from '../approval-task.service.js';
import logger from '../../utils/logger.js';
import { GATE_STEP_ORDER, getNextStep } from './phases.js';
import { canDepartmentApprove } from './authorization.js';

/**
 * Looks up GateStepConfig records for the given gateStep and creates a
 * PENDING AdmissionGateApproval for each configured department.
 */
export async function createApprovalsForGate(
  leadId: string,
  gateStep: AdmissionGateStatus,
  userId?: string,
) {
  const configs = await prisma.gateStepConfig.findMany({
    where: { gateStep },
    orderBy: { approvalOrder: 'asc' },
  });

  if (configs.length === 0) return [];

  const approvals = await prisma.$transaction(
    configs.map((cfg) =>
      prisma.admissionGateApproval.upsert({
        where: {
          leadId_gateStep_department: {
            leadId,
            gateStep,
            department: cfg.department,
          },
        },
        create: {
          leadId,
          gateStep,
          department: cfg.department,
          decision: 'PENDING',
          isRequired: cfg.isRequired,
        },
        update: {},
      }),
    ),
  );

  // Create tasks for each approval
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, familyName: true, code: true },
    });
    if (lead) {
      for (const approval of approvals) {
        try {
          // Resolve a valid createdById: use provided userId, or find first admin
          let taskCreatorId = userId;
          if (!taskCreatorId) {
            const admin = await prisma.user.findFirst({
              where: { role: 'ADMIN', status: 'ACTIVE' },
              select: { id: true },
            });
            taskCreatorId = admin?.id ?? '';
          }
          if (taskCreatorId) {
            await ApprovalTaskService.createApprovalTask(
              { id: approval.id, leadId: approval.leadId, gateStep: approval.gateStep, department: approval.department, isRequired: approval.isRequired },
              lead,
              taskCreatorId,
            );
          }
        } catch (err) {
          logger.warn('Failed to create approval task', { approvalId: approval.id, error: (err as Error).message });
        }
      }
    }
  } catch (err) {
    logger.warn('Failed to create approval tasks', { leadId, gateStep, error: (err as Error).message });
  }

  return approvals;
}

/**
 * Records a department's decision on a gate step for a given lead.
 * Validates that the calling user has an allowed role, then updates the
 * approval record and checks whether the gate can advance.
 */
export async function submitDepartmentApproval(
  leadId: string,
  gateStep: AdmissionGateStatus,
  department: AdmissionDepartment,
  decision: GateApprovalDecision,
  userId: string,
  notes?: string,
) {
  const allowed = await canDepartmentApprove(userId, gateStep);
  if (!allowed) {
    throw new Error('UNAUTHORIZED_DEPARTMENT_APPROVAL');
  }

  const existing = await prisma.admissionGateApproval.findUnique({
    where: {
      leadId_gateStep_department: { leadId, gateStep, department },
    },
  });

  if (!existing) {
    throw new Error('APPROVAL_RECORD_NOT_FOUND');
  }

  const updated = await prisma.admissionGateApproval.update({
    where: { id: existing.id },
    data: {
      decision,
      decidedById: userId,
      notes: notes ?? null,
      decidedAt: new Date(),
    },
  });

  try {
    await ApprovalTaskService.completeApprovalTask(existing.id, decision);
  } catch (err) {
    logger.warn('Failed to complete approval task', { approvalId: existing.id, error: (err as Error).message });
  }

  if (decision === 'APPROVED') {
    await checkAndAdvanceGate(leadId, gateStep, userId);
  }

  return updated;
}

/**
 * Gates where completing all approvals should auto-advance the lead to the
 * next step.  For most gates the lead should STOP at the approved step so
 * the user can perform the next manual action (e.g. schedule a visit).
 *
 * EVALUATION_COMPLETED → APPROVED is a natural consequence: once every
 * evaluation has been decided the lead is automatically approved.
 */
const AUTO_ADVANCE_PAST: Set<AdmissionGateStatus> = new Set([
  'EVALUATION_COMPLETED',
]);

/**
 * Checks whether all required departments have approved the given gate
 * step. If every required approval is APPROVED, transitions the lead to
 * the approved gate status (and optionally past it when the gate is in
 * the AUTO_ADVANCE_PAST whitelist).
 */
export async function checkAndAdvanceGate(
  leadId: string,
  gateStep: AdmissionGateStatus,
  userId: string,
) {
  const approvals = await prisma.admissionGateApproval.findMany({
    where: { leadId, gateStep, isRequired: true },
  });

  if (approvals.length === 0) return false;

  const allApproved = approvals.every((a) => a.decision === 'APPROVED');

  if (!allApproved) return false;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { admissionGateStatus: true },
  });
  if (!lead) return false;

  const currentIdx = GATE_STEP_ORDER.indexOf(lead.admissionGateStatus);
  const gateIdx = GATE_STEP_ORDER.indexOf(gateStep);

  // Lead is already past the gate — nothing to do
  if (currentIdx > gateIdx) return true;

  // Wrapped in try-catch: approval is already recorded, invariant failures
  // (e.g. EVALUATION_INCOMPLETE) should not bubble up as user-facing errors.
  // The gate will advance once the invariant is satisfied.
  try {
    if (currentIdx < gateIdx) {
      await AdmissionGateService.transition(leadId, gateStep, userId, undefined, true);
    }

    if (AUTO_ADVANCE_PAST.has(gateStep)) {
      const nextStep = getNextStep(gateStep);
      if (nextStep) {
        await AdmissionGateService.transition(leadId, nextStep, userId, undefined, true);
      }
    }
  } catch (err) {
    logger.warn('Gate auto-advance deferred — invariant not yet satisfied', {
      leadId, gateStep, error: err instanceof Error ? err.message : String(err),
    });
    return true;
  }

  return true;
}
