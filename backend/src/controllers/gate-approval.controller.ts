import { Response } from 'express';
import { z } from 'zod';
import { AdmissionDepartment, AdmissionGateStatus, GateApprovalDecision } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as GateApprovalService from '../services/gate-approval.service.js';
import * as AdmissionGateService from '../services/admission-gate.service.js';
import * as ApprovalTaskService from '../services/approval-task.service.js';
import logger from '../utils/logger.js';

const submitApprovalSchema = z.object({
  department: z.nativeEnum(AdmissionDepartment),
  decision: z.nativeEnum(GateApprovalDecision),
  notes: z.string().optional(),
});

export async function submitApproval(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId, gateStep } = req.params;
    const data = submitApprovalSchema.parse(req.body);

    const gateStepValidated = z.nativeEnum(AdmissionGateStatus).parse(gateStep);

    const result = await GateApprovalService.submitDepartmentApproval(
      leadId,
      gateStepValidated,
      data.department,
      data.decision,
      req.user!.id,
      data.notes,
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ADMISSION_GATE_CHANGED',
      entityType: 'LEAD',
      entityId: leadId,
      metadata: { gateStep: gateStepValidated, department: data.department, decision: data.decision },
    }, req);

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'APPROVAL_NOT_FOUND' || error.message === 'APPROVAL_RECORD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Aprovação não encontrada' });
      }
      if (error.message === 'UNAUTHORIZED_DEPARTMENT' || error.message === 'UNAUTHORIZED_DEPARTMENT_APPROVAL') {
        return res.status(403).json({ success: false, error: 'Sem permissão para este departamento' });
      }
    }
    logger.error('Submit gate approval error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getLeadApprovals(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await GateApprovalService.getApprovalMatrix(req.params.leadId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Get lead approvals error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getGateApprovals(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId, gateStep } = req.params;
    const gateStepValidated = z.nativeEnum(AdmissionGateStatus).parse(gateStep);

    const matrix = await GateApprovalService.getApprovalMatrix(leadId);
    const gateApprovals = matrix[gateStepValidated] || [];

    res.json({ success: true, data: gateApprovals });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Etapa inválida', details: error.errors });
    }
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Get gate approvals error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getConfig(req: AuthenticatedRequest, res: Response) {
  try {
    const configs = await GateApprovalService.getGateConfig();
    res.json({ success: true, data: configs });
  } catch (error) {
    logger.error('Get gate config error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getPipelineStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await GateApprovalService.getFullPipelineStatus(req.params.leadId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Get pipeline status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

const transitionGateSchema = z.object({
  newStatus: z.nativeEnum(AdmissionGateStatus),
  notes: z.string().optional(),
});

export async function transitionGate(req: AuthenticatedRequest, res: Response) {
  try {
    const { leadId } = req.params;
    const { newStatus, notes } = transitionGateSchema.parse(req.body);

    // Only ADMIN can force-bypass approval checks
    const force = req.user!.role === 'ADMIN';
    await AdmissionGateService.transition(leadId, newStatus, req.user!.id, notes, force);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'ADMISSION_GATE_CHANGED',
      entityType: 'LEAD',
      entityId: leadId,
      metadata: { newStatus, notes, forced: force },
    }, req);

    res.json({ success: true, data: { leadId, newStatus } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message.startsWith('INVALID_GATE_TRANSITION')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      if (error.message === 'GATE_PENDING_APPROVALS') {
        return res.status(409).json({ success: false, error: 'Este gate possui aprovações departamentais pendentes. Aguarde a aprovação das áreas responsáveis.' });
      }
    }
    logger.error('Transition gate error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getMyPendingApprovals(req: AuthenticatedRequest, res: Response) {
  try {
    const tasks = await ApprovalTaskService.getMyPendingApprovalTasks(req.user!.id);
    res.json({ success: true, data: tasks });
  } catch (error) {
    logger.error('Get my pending approvals error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getPendingSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const summary = await ApprovalTaskService.getPendingSummary(req.user!.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Get pending summary error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
