import { Response } from 'express';
import { AuthenticatedRequest } from '../../types/index.js';
import * as StudentsService from '../../services/students/index.js';
import logger from '../../utils/logger.js';

async function handleRelatedUpdate(
  req: AuthenticatedRequest,
  res: Response,
  updateFn: (studentId: string, data: Record<string, unknown>, actorId: string) => Promise<any>,
  errorMsg: string,
) {
  try {
    const { id } = req.params;
    const result = await updateFn(id, req.body, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    logger.error(errorMsg, { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: errorMsg });
  }
}

export async function updateHealth(req: AuthenticatedRequest, res: Response) {
  return handleRelatedUpdate(req, res, StudentsService.updateStudentHealth, 'Erro ao atualizar dados de saúde.');
}

export async function updateTransport(req: AuthenticatedRequest, res: Response) {
  return handleRelatedUpdate(req, res, StudentsService.updateStudentTransport, 'Erro ao atualizar dados de transporte.');
}

export async function updateEnrollmentInfo(req: AuthenticatedRequest, res: Response) {
  return handleRelatedUpdate(req, res, StudentsService.updateStudentEnrollmentInfo, 'Erro ao atualizar informações de matrícula.');
}

export async function updateHealthPlan(req: AuthenticatedRequest, res: Response) {
  return handleRelatedUpdate(req, res, StudentsService.updateStudentHealthPlan, 'Erro ao atualizar plano de saúde.');
}

export async function updateEmergencyContact(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, contactId } = req.params;
    const result = await StudentsService.updateStudentEmergencyContact(id, contactId, req.body, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    logger.error('Failed to update emergency contact', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar contato de emergência.' });
  }
}

export async function updateParent(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, parentId } = req.params;
    const result = await StudentsService.updateStudentParent(id, parentId, req.body, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    logger.error('Failed to update parent', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar dados do responsável.' });
  }
}
