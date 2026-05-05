import { Response } from 'express';
import { z } from 'zod';
import { EvaluationDecision } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as EvaluationsService from '../services/evaluations.service.js';
import logger from '../utils/logger.js';

const createEvaluationSchema = z.object({
  eventId: z.string().uuid(),
  childId: z.string().uuid(),
  leadId: z.string().uuid(),
  teacherName: z.string().min(2),
  evaluationDate: z.string(),
  behavior: z.string().optional(),
  english: z.string().optional(),
  interactionWithKids: z.string().optional(),
  mathPlacement: z.string().optional(),
  englishPlacement: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const updateEvaluationSchema = z.object({
  teacherName: z.string().min(2).optional(),
  evaluationDate: z.string().optional(),
  behavior: z.string().optional(),
  english: z.string().optional(),
  interactionWithKids: z.string().optional(),
  mathPlacement: z.string().optional(),
  englishPlacement: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const decisionSchema = z.object({
  decision: z.nativeEnum(EvaluationDecision),
  notes: z.string().optional(),
});

export async function getByEventId(req: AuthenticatedRequest, res: Response) {
  try {
    const evaluations = await EvaluationsService.findByEventId(req.params.eventId);
    res.json({ success: true, data: evaluations });
  } catch (error) {
    logger.error('Get evaluations by event error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const evaluation = await EvaluationsService.findById(req.params.id);
    if (!evaluation) {
      return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
    }
    res.json({ success: true, data: evaluation });
  } catch (error) {
    logger.error('Get evaluation error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getByLeadId(req: AuthenticatedRequest, res: Response) {
  try {
    const evaluations = await EvaluationsService.findByLeadId(req.params.leadId);
    res.json({ success: true, data: evaluations });
  } catch (error) {
    logger.error('Get evaluations by lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createEvaluationSchema.parse(req.body);
    const evaluation = await EvaluationsService.create(data, req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'EVALUATION_CREATED',
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      metadata: { eventId: data.eventId, childId: data.childId, leadId: data.leadId },
    }, req);

    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Evento não encontrado' });
      }
      if (error.message === 'EVENT_NOT_VIVENCIA') {
        return res.status(400).json({ success: false, error: 'Avaliações só podem ser criadas para vivências' });
      }
      if (error.message === 'CHILD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Criança não encontrada' });
      }
    }
    logger.error('Create evaluation error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateEvaluationSchema.parse(req.body);
    const evaluation = await EvaluationsService.update(req.params.id, data, req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'EVALUATION_UPDATED',
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      metadata: {
        updatedFields: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined),
        childName: evaluation.child?.fullName,
        leadCode: evaluation.lead?.code,
      },
    }, req);

    res.json({ success: true, data: evaluation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'EVALUATION_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
    }
    logger.error('Update evaluation error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function makeDecision(req: AuthenticatedRequest, res: Response) {
  try {
    const { decision, notes } = decisionSchema.parse(req.body);
    const evaluation = await EvaluationsService.makeDecision(
      req.params.id,
      decision,
      req.user!.id,
      notes
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'EVALUATION_UPDATED',
      entityType: 'EVALUATION',
      entityId: evaluation.id,
      metadata: { decision, notes },
    }, req);

    res.json({ success: true, data: evaluation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'EVALUATION_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
    }
    logger.error('Make evaluation decision error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
