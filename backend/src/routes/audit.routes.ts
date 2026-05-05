import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { getAuditLogs, getAuditStats, getUniqueEntityTypes } from '../services/audit.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { Response } from 'express';
import { AuditAction } from '@prisma/client';
import logger from '../utils/logger.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

// Get audit logs
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, actorId, action, entityType, startDate, endDate, search } = req.query;

    const result = await getAuditLogs({
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 50,
      actorId: actorId as string,
      action: action as AuditAction,
      entityType: entityType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Get audit statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getAuditStats({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get audit stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Get available actions for filter
router.get('/actions', async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: Object.values(AuditAction),
  });
});

// Get unique entity types for filter
router.get('/entity-types', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entityTypes = await getUniqueEntityTypes();
    res.json({ success: true, data: entityTypes });
  } catch (error) {
    logger.error('Get entity types error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
