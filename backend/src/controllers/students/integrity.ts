import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import * as StudentsService from '../../services/students/index.js';
import logger from '../../utils/logger.js';

export async function integrityAudit(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await StudentsService.auditIntegrity();
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Integrity audit failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao executar auditoria de integridade.' });
  }
}

export async function integrityRepair(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await StudentsService.repairIntegrity(req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Integrity repair failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao reparar integridade dos dados.' });
  }
}
