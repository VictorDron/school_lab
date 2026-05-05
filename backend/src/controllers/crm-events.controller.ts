import { Response } from 'express';
import { z } from 'zod';
import { AuditAction, CrmEventType, VisitStatus, VivenciaStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as CrmEventsService from '../services/crm-events.service.js';
import { ScheduleConflictError } from '../services/crm-events.service.js';
import * as AdmissionGateService from '../services/admission-gate.service.js';
import logger from '../utils/logger.js';

const createEventSchema = z.object({
  leadId: z.string().uuid(),
  eventType: z.nativeEnum(CrmEventType),
  title: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().optional(),
  color: z.string().optional(),
  assignedTeacherId: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

const updateEventSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  color: z.string().optional(),
  assignedTeacherId: z.string().uuid().optional().nullable(),
  force: z.boolean().optional(),
});

const updateStatusSchema = z.object({
  status: z.string(),
  notes: z.string().optional(),
});

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const { startDate, endDate, eventType, leadId } = req.query;

    const events = await CrmEventsService.findMany({
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      eventType: eventType as CrmEventType | undefined,
      leadId: leadId as string | undefined,
    });

    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('List CRM events error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const event = await CrmEventsService.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Evento não encontrado' });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    logger.error('Get CRM event error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getByLeadId(req: AuthenticatedRequest, res: Response) {
  try {
    const events = await CrmEventsService.findByLeadId(req.params.leadId);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('Get CRM events by lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createEventSchema.parse(req.body);
    const event = await CrmEventsService.create(data, req.user!.id);

    const auditAction: AuditAction = data.eventType === 'VISIT' ? 'VISIT_SCHEDULED' : 'VIVENCIA_SCHEDULED';
    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: auditAction,
      entityType: 'CRM_EVENT',
      entityId: event.id,
      metadata: { leadId: data.leadId, eventType: data.eventType, title: data.title },
    }, req);

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof ScheduleConflictError) {
      return res.status(409).json({
        success: false,
        error: 'SCHEDULE_CONFLICT',
        conflicts: error.conflicts,
      });
    }
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Create CRM event error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const { force, ...data } = updateEventSchema.parse(req.body);
    const event = await CrmEventsService.update(req.params.id, data, force);

    res.json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof ScheduleConflictError) {
      return res.status(409).json({
        success: false,
        error: 'SCHEDULE_CONFLICT',
        conflicts: error.conflicts,
      });
    }
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Evento não encontrado' });
    }
    logger.error('Update CRM event error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const event = await CrmEventsService.remove(req.params.id);
    res.json({ success: true, message: 'Evento deletado com sucesso' });
  } catch (error) {
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Evento não encontrado' });
    }
    logger.error('Delete CRM event error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, notes } = updateStatusSchema.parse(req.body);
    const event = await CrmEventsService.updateStatus(req.params.id, status, notes, req.user!.id);

    const auditAction: AuditAction = status === 'COMPLETED'
      ? (event.eventType === 'VISIT' ? 'VISIT_COMPLETED' : 'VIVENCIA_COMPLETED')
      : (event.eventType === 'VISIT' ? 'VISIT_CANCELLED' : 'VIVENCIA_CANCELLED');

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: auditAction,
      entityType: 'CRM_EVENT',
      entityId: event.id,
      metadata: { status, eventType: event.eventType },
    }, req);

    res.json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'EVENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Evento não encontrado' });
    }
    logger.error('Update CRM event status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function approveVisit(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId é obrigatório' });
    }

    await AdmissionGateService.transition(leadId, 'VISIT_APPROVED', req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ADMISSION_GATE_CHANGED',
      entityType: 'LEAD',
      entityId: leadId,
      metadata: { action: 'VISIT_APPROVED' },
    }, req);

    res.json({ success: true, message: 'Visita aprovada com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message.startsWith('INVALID_GATE_TRANSITION')) {
        return res.status(400).json({ success: false, error: 'Transição de status inválida' });
      }
    }
    logger.error('Approve visit error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function rejectLead(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, error: 'leadId é obrigatório' });
    }

    await AdmissionGateService.transition(leadId, 'REJECTED', req.user!.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ADMISSION_GATE_CHANGED',
      entityType: 'LEAD',
      entityId: leadId,
      metadata: { action: 'REJECTED' },
    }, req);

    res.json({ success: true, message: 'Lead rejeitado' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message.startsWith('INVALID_GATE_TRANSITION')) {
        return res.status(400).json({ success: false, error: 'Transição de status inválida' });
      }
    }
    logger.error('Reject lead error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
