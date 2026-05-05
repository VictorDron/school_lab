import { prisma } from '../../config/database.js';
import { PHASES, GATE_STEP_ORDER } from './phases.js';

/**
 * Returns all approval records for a lead, grouped by gateStep.
 * Useful for timeline / matrix display in the UI.
 */
export async function getApprovalMatrix(leadId: string) {
  const approvals = await prisma.admissionGateApproval.findMany({
    where: { leadId },
    include: {
      decidedBy: { select: { id: true, displayName: true } },
    },
    orderBy: [{ gateStep: 'asc' }, { createdAt: 'asc' }],
  });

  const matrix: Record<string, typeof approvals> = {};

  for (const approval of approvals) {
    const step = approval.gateStep;
    if (!matrix[step]) {
      matrix[step] = [];
    }
    matrix[step].push(approval);
  }

  return matrix;
}

/**
 * Returns the lead's current admission status, all approvals grouped by
 * gate step, and a completion percentage for each phase.
 */
export async function getFullPipelineStatus(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      familyName: true,
      admissionGateStatus: true,
    },
  });

  if (!lead) throw new Error('LEAD_NOT_FOUND');

  const approvalMatrix = await getApprovalMatrix(leadId);

  const currentStepIndex = GATE_STEP_ORDER.indexOf(lead.admissionGateStatus);

  const isTerminalSuccess = lead.admissionGateStatus === 'ENROLLED';

  const phases = PHASES.map((phase) => {
    // When ENROLLED (terminal success), all phases are 100%
    const stepsCompleted = isTerminalSuccess
      ? phase.steps.length
      : phase.steps.filter((step) => {
          const stepIndex = GATE_STEP_ORDER.indexOf(step);
          return stepIndex < currentStepIndex;
        }).length;

    const isCurrent = !isTerminalSuccess && phase.steps.includes(lead.admissionGateStatus);

    const percentage =
      phase.steps.length > 0
        ? Math.round((stepsCompleted / phase.steps.length) * 100)
        : 0;

    return {
      name: phase.name,
      steps: phase.steps,
      stepsCompleted,
      totalSteps: phase.steps.length,
      percentage,
      isCurrent,
      approvals: phase.steps.reduce(
        (acc, step) => {
          if (approvalMatrix[step]) {
            acc[step] = approvalMatrix[step];
          }
          return acc;
        },
        {} as Record<string, (typeof approvalMatrix)[string]>,
      ),
    };
  });

  return {
    leadId: lead.id,
    familyName: lead.familyName,
    currentStatus: lead.admissionGateStatus,
    phases,
  };
}

/**
 * Returns all GateStepConfig records, ordered by gate step and approval order.
 */
export async function getGateConfig() {
  return prisma.gateStepConfig.findMany({
    orderBy: [{ gateStep: 'asc' }, { approvalOrder: 'asc' }],
  });
}
