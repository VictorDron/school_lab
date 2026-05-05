import type { Response } from 'express';
import { createAuditLog } from '../../services/audit.service.js';
import * as EnrollmentService from '../../services/enrollment.service.js';
import * as LeadsService from '../../services/leads/index.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import logger from '../../utils/logger.js';

// ==================== APPLICATION (ADMISSION) LINK ====================

export async function generateLink(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await LeadsService.generateApplicationLink(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Generate application link error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getTokenStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await LeadsService.getTokenStatus(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Get token status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function revokeToken(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await LeadsService.revokeToken(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Revoke token error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

/**
 * Send the application link by email. Service-side cooldown of 2 min
 * prevents accidental re-sends; the controller surfaces that as a 429.
 */
export async function sendApplicationLinkEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await LeadsService.sendApplicationLinkByEmail(req.params.id, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: req.params.id,
        metadata: { action: 'APPLICATION_LINK_EMAILED', sentTo: result.sentTo },
      },
      req,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'NO_ACTIVE_TOKEN') {
        return res
          .status(400)
          .json({ success: false, error: 'Nenhum link ativo para enviar. Gere um novo link primeiro.' });
      }
      if (error.message === 'EMAIL_COOLDOWN') {
        return res.status(429).json({
          success: false,
          error: 'Email enviado recentemente. Aguarde 2 minutos antes de enviar novamente.',
        });
      }
      if (error.message === 'EMAIL_SEND_FAILED') {
        return res.status(500).json({ success: false, error: 'Falha ao enviar email. Tente novamente.' });
      }
    }
    logger.error('Send application link email error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== ENROLLMENT (MATRÍCULA) LINK ====================

/**
 * Issue an enrollment link only after the admission form was submitted.
 * The service guards on `ADMISSION_NOT_COMPLETED` and `APPLICANT_NOT_FOUND`
 * so we surface those as actionable 400s rather than generic 500s.
 */
export async function generateEnrollmentLink(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await EnrollmentService.generateEnrollmentLink(req.params.id, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: req.params.id,
        metadata: { action: 'ENROLLMENT_LINK_GENERATED', expiresAt: result.expiresAt },
      },
      req,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'ADMISSION_NOT_COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'A família ainda não completou o formulário de admissão.',
          code: 'ADMISSION_NOT_COMPLETED',
        });
      }
      if (error.message === 'APPLICANT_NOT_FOUND') {
        return res.status(400).json({
          success: false,
          error: 'Nenhum aluno encontrado no lead. Verifique os dados da admissão.',
          code: 'APPLICANT_NOT_FOUND',
        });
      }
    }
    logger.error('Generate enrollment link error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getEnrollmentTokenStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await EnrollmentService.getEnrollmentTokenStatus(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Get enrollment token status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function sendEnrollmentLinkEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await EnrollmentService.sendEnrollmentLinkByEmail(req.params.id, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: req.params.id,
        metadata: { action: 'ENROLLMENT_LINK_EMAILED', sentTo: result.sentTo },
      },
      req,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'LEAD_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Lead não encontrado' });
      }
      if (error.message === 'NO_ACTIVE_TOKEN') {
        return res.status(400).json({
          success: false,
          error: 'Nenhum link de matrícula ativo para enviar. Gere um novo link primeiro.',
        });
      }
      if (error.message === 'EMAIL_COOLDOWN') {
        return res.status(429).json({
          success: false,
          error: 'Email enviado recentemente. Aguarde 2 minutos antes de enviar novamente.',
        });
      }
      if (error.message === 'EMAIL_SEND_FAILED') {
        return res.status(500).json({ success: false, error: 'Falha ao enviar email. Tente novamente.' });
      }
    }
    logger.error('Send enrollment link email error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function revokeEnrollmentToken(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await EnrollmentService.revokeEnrollmentToken(req.params.id, req.user!.id);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'LEAD_UPDATED',
        entityType: 'LEAD',
        entityId: req.params.id,
        metadata: { action: 'ENROLLMENT_TOKEN_REVOKED' },
      },
      req,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Revoke enrollment token error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
