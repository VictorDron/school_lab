import { ApplicationStatus } from '@prisma/client';
import type { Response } from 'express';
import * as DashboardService from '../../services/dashboard.service.js';
import * as LeadsService from '../../services/leads/index.js';
import {
  getUnviewedLeadsCount,
  markLeadAsViewed,
} from '../../services/notifications.service.js';
import { createAuditLog } from '../../services/audit.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import logger from '../../utils/logger.js';

const VALID_APPLICATION_STATUSES: ApplicationStatus[] = [
  'PENDING',
  'LINK_SENT',
  'FORM_RECEIVED',
  'NOT_REQUIRED',
];

export async function getStats(_req: AuthenticatedRequest, res: Response) {
  try {
    const stats = await LeadsService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get lead stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getDashboard(_req: AuthenticatedRequest, res: Response) {
  try {
    const stats = await DashboardService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getPipeline(_req: AuthenticatedRequest, res: Response) {
  try {
    const pipeline = await LeadsService.getPipelineStats();
    res.json({ success: true, data: pipeline });
  } catch (error) {
    logger.error('Get pipeline stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getUnviewedCount(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await getUnviewedLeadsCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    logger.error('Get unviewed count error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function markViewed(req: AuthenticatedRequest, res: Response) {
  try {
    await markLeadAsViewed(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Lead marcado como visualizado' });
  } catch (error) {
    logger.error('Mark lead viewed error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Bulk-mark every FORM_RECEIVED lead the user hasn't seen yet. The
 * dynamic import is intentional — the bulk function lives in
 * notifications.service and isn't called frequently enough to warrant
 * top-level import overhead.
 */
export async function markAllViewed(req: AuthenticatedRequest, res: Response) {
  try {
    const { markAllLeadsAsViewed } = await import('../../services/notifications.service.js');
    const count = await markAllLeadsAsViewed(req.user!.id);
    res.json({
      success: true,
      message: `${count} leads marcados como visualizados`,
      data: { count },
    });
  } catch (error) {
    logger.error('Mark all leads viewed error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateApplicationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { status } = req.body;

    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido. Valores permitidos: PENDING, LINK_SENT, FORM_RECEIVED, NOT_REQUIRED',
      });
    }

    const updated = await LeadsService.updateApplicationStatus(req.params.id, status, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: updated.id,
        metadata: { applicationStatus: status },
      },
      req,
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Update application status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
