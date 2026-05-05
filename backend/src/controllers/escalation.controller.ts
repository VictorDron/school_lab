import { Response } from 'express';
import { z } from 'zod';
import { AdmissionDepartment, AdmissionGateStatus, EscalationSeverity } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as EscalationService from '../services/escalation.service.js';
import logger from '../utils/logger.js';

const createEscalationSchema = z.object({
  leadId: z.string().uuid(),
  childId: z.string().uuid().optional(),
  department: z.nativeEnum(AdmissionDepartment),
  gateStep: z.nativeEnum(AdmissionGateStatus),
  description: z.string().min(5),
  severity: z.nativeEnum(EscalationSeverity).optional(),
});

const resolveEscalationSchema = z.object({
  notes: z.string().min(3),
});

export async function getActiveEscalations(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await EscalationService.getActiveEscalations();
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get active escalations error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getLeadEscalations(req: AuthenticatedRequest, res: Response) {
  try {
    const data = await EscalationService.getLeadEscalations(req.params.leadId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get lead escalations error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createEscalation(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createEscalationSchema.parse(req.body);
    const escalation = await EscalationService.createEscalation(data, req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ESCALATION_CREATED',
      entityType: 'ESCALATION',
      entityId: escalation.id,
      metadata: { leadId: data.leadId, department: data.department, gateStep: data.gateStep },
    }, req);

    res.status(201).json({ success: true, data: escalation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Create escalation error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function resolveEscalation(req: AuthenticatedRequest, res: Response) {
  try {
    const { notes } = resolveEscalationSchema.parse(req.body);
    const escalation = await EscalationService.resolveEscalation(req.params.id, notes, req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ESCALATION_RESOLVED',
      entityType: 'ESCALATION',
      entityId: escalation.id,
      metadata: { resolved: true, notes },
    }, req);

    res.json({ success: true, data: escalation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'ESCALATION_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Escalação não encontrada' });
    }
    logger.error('Resolve escalation error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
