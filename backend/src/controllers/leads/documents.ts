import type { Response } from 'express';
import { createAuditLog } from '../../services/audit.service.js';
import * as EnrollmentService from '../../services/enrollment.service.js';
import * as LeadsService from '../../services/leads/index.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import logger from '../../utils/logger.js';

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo obrigatório' });
    }

    const { type, name, childId } = req.body;

    const document = await LeadsService.uploadDocument(
      req.params.id,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      req.user!.id,
      type,
      name,
      childId,
    );

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'UPLOAD_FAILED') {
        return res.status(500).json({ success: false, error: 'Falha no upload do arquivo' });
      }
    }
    logger.error('Upload lead document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
  try {
    await LeadsService.deleteDocument(req.params.docId, req.params.id, req.user!.id);
    res.json({ success: true, message: 'Documento deletado com sucesso' });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    logger.error('Delete lead document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Approve or reject a document submitted via the public enrollment
 * form. REJECTED requires a `rejectionReason` so the family knows what
 * to fix when they're notified to re-upload.
 */
export async function reviewEnrollmentDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, rejectionReason } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido. Use APPROVED ou REJECTED.' });
    }

    if (status === 'REJECTED' && !rejectionReason) {
      return res.status(400).json({ success: false, error: 'Motivo da rejeição é obrigatório.' });
    }

    const document = await EnrollmentService.reviewEnrollmentDocument(
      req.params.docId,
      req.params.id,
      req.user!.id,
      status,
      rejectionReason,
    );

    res.json({ success: true, data: document });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Documento não encontrado' });
      }
      if (error.message === 'DOCUMENT_NOT_AUTHORIZED') {
        return res.status(403).json({ success: false, error: 'Documento não pertence a este lead' });
      }
    }
    logger.error('Review enrollment document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteEnrollmentDocument(req: AuthenticatedRequest, res: Response) {
  try {
    await EnrollmentService.deleteEnrollmentDocument(req.params.docId, req.params.id);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'LEAD_UPDATED',
      entityType: 'ENROLLMENT_DOCUMENT',
      entityId: req.params.docId,
      metadata: { leadId: req.params.id, operation: 'DELETE' },
    });

    res.json({ success: true, message: 'Documento de matrícula deletado com sucesso' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Documento não encontrado' });
      }
      if (error.message === 'DOCUMENT_NOT_AUTHORIZED') {
        return res.status(403).json({ success: false, error: 'Documento não pertence a este lead' });
      }
    }
    logger.error('Delete enrollment document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
