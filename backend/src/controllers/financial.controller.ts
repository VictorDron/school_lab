import { Response } from 'express';
import { z } from 'zod';
import { FinancialAnalysisStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { createAuditLog } from '../services/audit.service.js';
import * as FinancialService from '../services/financial.service.js';
import logger from '../utils/logger.js';

const createAnalysisSchema = z.object({
  leadId: z.string().uuid(),
  cpfAnalyzed: z.string().optional(),
  analysisNotes: z.string().optional(),
});

const updateAnalysisSchema = z.object({
  cpfAnalyzed: z.string().optional(),
  cpfStatus: z.string().optional(),
  analysisNotes: z.string().optional(),
  negotiationNotes: z.string().optional(),
});

const approveAnalysisSchema = z.object({
  status: z.nativeEnum(FinancialAnalysisStatus),
});

const recordPaymentSchema = z.object({
  paidAt: z.string().optional(),
});

export async function createAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createAnalysisSchema.parse(req.body);
    const analysis = await FinancialService.createAnalysis(data);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'FINANCIAL_ANALYSIS_CREATED',
      entityType: 'LEAD',
      entityId: data.leadId,
      metadata: { analysisId: analysis.id },
    }, req);

    res.status(201).json({ success: true, data: analysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'LEAD_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }
    logger.error('Create financial analysis error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateAnalysisSchema.parse(req.body);
    const analysis = await FinancialService.updateAnalysis(req.params.id, data);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'FINANCIAL_ANALYSIS_UPDATED',
      entityType: 'LEAD',
      entityId: analysis.leadId,
      metadata: { analysisId: analysis.id },
    }, req);

    res.json({ success: true, data: analysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'ANALYSIS_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Análise financeira não encontrada' });
    }
    logger.error('Update financial analysis error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function approveAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const data = approveAnalysisSchema.parse(req.body);
    const analysis = await FinancialService.approveAnalysis(req.params.id, data.status);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'FINANCIAL_ANALYSIS_APPROVED',
      entityType: 'LEAD',
      entityId: analysis.leadId,
      metadata: { analysisId: analysis.id, status: data.status },
    }, req);

    res.json({ success: true, data: analysis });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'ANALYSIS_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Análise financeira não encontrada' });
    }
    logger.error('Approve financial analysis error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function recordPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const data = recordPaymentSchema.parse(req.body);
    const payment = await FinancialService.recordPayment(req.params.id, data.paidAt);

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'PAYMENT_RECORDED',
      entityType: 'LEAD',
      entityId: payment.contract.leadId,
      metadata: { paymentId: payment.id },
    }, req);

    res.json({ success: true, data: payment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof Error && error.message === 'PAYMENT_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Pagamento não encontrado' });
    }
    logger.error('Record payment error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
