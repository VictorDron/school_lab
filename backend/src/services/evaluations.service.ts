import { prisma } from '../config/database.js';
import { EvaluationDecision } from '@prisma/client';
import * as AdmissionGateService from './admission-gate.service.js';
import * as GateApprovalService from './gate-approval.service.js';
import logger from '../utils/logger.js';
import { createAppError } from '../lib/error-messages.js';

export interface CreateEvaluationData {
  eventId: string;
  childId: string;
  leadId: string;
  teacherName: string;
  evaluationDate: string;
  behavior?: string;
  english?: string;
  interactionWithKids?: string;
  mathPlacement?: string;
  englishPlacement?: string;
  additionalNotes?: string;
}

export interface UpdateEvaluationData {
  teacherName?: string;
  evaluationDate?: string;
  behavior?: string;
  english?: string;
  interactionWithKids?: string;
  mathPlacement?: string;
  englishPlacement?: string;
  additionalNotes?: string;
}

const evaluationInclude = {
  event: { select: { id: true, title: true, eventType: true, startDate: true } },
  child: { select: { id: true, fullName: true, desiredGrade: true } },
  lead: { select: { id: true, code: true, familyName: true } },
  evaluatedBy: { select: { id: true, displayName: true } },
  decisionBy: { select: { id: true, displayName: true } },
  lastEditedBy: { select: { id: true, displayName: true } },
};

export async function findByEventId(eventId: string) {
  return prisma.experienceEvaluation.findMany({
    where: { eventId },
    include: evaluationInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function findById(id: string) {
  return prisma.experienceEvaluation.findUnique({
    where: { id },
    include: evaluationInclude,
  });
}

export async function findByLeadId(leadId: string) {
  return prisma.experienceEvaluation.findMany({
    where: { leadId },
    include: evaluationInclude,
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: CreateEvaluationData, userId: string) {
  // Validate event exists and is a vivência
  const event = await prisma.crmEvent.findUnique({ where: { id: data.eventId } });
  if (!event) throw createAppError('EVENT_NOT_FOUND');
  if (event.eventType !== 'VIVENCIA') throw createAppError('EVENT_NOT_VIVENCIA');

  // Validate child belongs to lead
  const child = await prisma.leadChild.findFirst({
    where: { id: data.childId, leadId: data.leadId },
  });
  if (!child) throw createAppError('CHILD_NOT_FOUND');

  return prisma.experienceEvaluation.create({
    data: {
      eventId: data.eventId,
      childId: data.childId,
      leadId: data.leadId,
      teacherName: data.teacherName,
      evaluatedById: userId,
      evaluationDate: new Date(data.evaluationDate),
      behavior: data.behavior,
      english: data.english,
      interactionWithKids: data.interactionWithKids,
      mathPlacement: data.mathPlacement,
      englishPlacement: data.englishPlacement,
      additionalNotes: data.additionalNotes,
    },
    include: evaluationInclude,
  });
}

export async function update(id: string, data: UpdateEvaluationData, userId: string) {
  const evaluation = await prisma.experienceEvaluation.findUnique({ where: { id } });
  if (!evaluation) throw createAppError('EVALUATION_NOT_FOUND');

  return prisma.experienceEvaluation.update({
    where: { id },
    data: {
      teacherName: data.teacherName,
      evaluationDate: data.evaluationDate ? new Date(data.evaluationDate) : undefined,
      behavior: data.behavior,
      english: data.english,
      interactionWithKids: data.interactionWithKids,
      mathPlacement: data.mathPlacement,
      englishPlacement: data.englishPlacement,
      additionalNotes: data.additionalNotes,
      lastEditedById: userId,
      lastEditedAt: new Date(),
    },
    include: evaluationInclude,
  });
}

export async function makeDecision(
  id: string,
  decision: EvaluationDecision,
  userId: string,
  notes?: string
) {
  const evaluation = await prisma.experienceEvaluation.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!evaluation) throw createAppError('EVALUATION_NOT_FOUND');

  const updated = await prisma.experienceEvaluation.update({
    where: { id },
    data: {
      decision,
      decisionById: userId,
      decisionAt: new Date(),
      decisionNotes: notes,
    },
    include: evaluationInclude,
  });

  // Check if all evaluations for this lead's event have decisions
  const allEvaluations = await prisma.experienceEvaluation.findMany({
    where: { eventId: evaluation.eventId },
  });

  const allDecided = allEvaluations.every(e => e.decision !== 'PENDING');

  if (allDecided) {
    const hasRejection = allEvaluations.some(e => e.decision === 'REJECTED');

    try {
      // First advance to EVALUATION_COMPLETED — invariant is satisfied since we just decided all evaluations
      await AdmissionGateService.transition(evaluation.leadId, 'EVALUATION_COMPLETED', userId);

      // Then decide final outcome
      if (hasRejection) {
        await AdmissionGateService.transition(evaluation.leadId, 'REJECTED', userId, undefined, true);
      } else {
        // Create and auto-approve EVALUATION_COMPLETED gate approvals (PSY/HEA/COO)
        // The evaluation approval itself IS the department assessment, so auto-approve them
        try {
          const evalApprovals = await GateApprovalService.createApprovalsForGate(evaluation.leadId, 'EVALUATION_COMPLETED');
          // Auto-approve all created records since evaluations are already approved
          for (const approval of evalApprovals) {
            await prisma.admissionGateApproval.update({
              where: { id: approval.id },
              data: { decision: 'APPROVED', decidedById: userId, decidedAt: new Date(), notes: 'Aprovado automaticamente — avaliações concluídas' },
            });
          }
        } catch (err) {
          logger.warn('Failed to create/approve EVALUATION_COMPLETED approvals', { leadId: evaluation.leadId, error: (err as Error).message });
        }

        // Now check if all EVALUATION_COMPLETED approvals are done → advance to APPROVED
        try {
          await GateApprovalService.checkAndAdvanceGate(evaluation.leadId, 'EVALUATION_COMPLETED', userId);
        } catch (err) {
          logger.warn('checkAndAdvanceGate failed after EVALUATION_COMPLETED', { leadId: evaluation.leadId, error: (err as Error).message });
        }

        // Also create approval records for APPROVED gate (for next step)
        try {
          await GateApprovalService.createApprovalsForGate(evaluation.leadId, 'APPROVED');
        } catch (err) {
          logger.warn('Failed to create gate approvals', { leadId: evaluation.leadId, gate: 'APPROVED', error: (err as Error).message });
        }
      }
    } catch (err) {
      logger.warn('Gate transition failed on evaluation decision', { leadId: evaluation.leadId, error: (err as Error).message });
    }
  }

  return updated;
}
