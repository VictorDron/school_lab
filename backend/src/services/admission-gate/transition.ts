import { prisma } from '../../config/database.js';
import { AdmissionGateStatus } from '@prisma/client';
import { createAppError } from '../../lib/error-messages.js';
import { gateToColumnSlug, canTransition } from './state-machine.js';
import { assertEvaluationComplete, assertGateApproved } from './invariants.js';
import { runGateNotifications } from './notifications.js';
import { runAutoAdvance } from './auto-advance.js';

export async function transition(
  leadId: string,
  newStatus: AdmissionGateStatus,
  userId: string,
  notes?: string,
  force?: boolean,
): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, admissionGateStatus: true },
  });

  if (!lead) throw createAppError('LEAD_NOT_FOUND');

  if (!canTransition(lead.admissionGateStatus, newStatus)) {
    throw createAppError('INVALID_GATE_TRANSITION', `${lead.admissionGateStatus} → ${newStatus}`);
  }

  await assertEvaluationComplete(leadId, newStatus);
  await assertGateApproved(leadId, newStatus, userId, force ?? false);

  const targetSlug = gateToColumnSlug[newStatus];
  let columnId: string | undefined;
  if (targetSlug) {
    const col = await prisma.kanbanColumn.findUnique({ where: { slug: targetSlug } });
    if (col) columnId = col.id;
  }

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        admissionGateStatus: newStatus,
        ...(columnId ? { columnId } : {}),
      },
    }),
    prisma.leadHistory.create({
      data: {
        leadId,
        action: 'ADMISSION_GATE_CHANGED',
        actorId: userId,
        details: {
          previousStatus: lead.admissionGateStatus,
          newStatus,
          ...(notes ? { notes } : {}),
        },
      },
    }),
  ]);

  await runGateNotifications(newStatus, leadId, userId, notes);
  await runAutoAdvance(newStatus, leadId, userId);
}

export async function getStatus(leadId: string): Promise<AdmissionGateStatus> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { admissionGateStatus: true },
  });

  if (!lead) throw createAppError('LEAD_NOT_FOUND');

  return lead.admissionGateStatus;
}
