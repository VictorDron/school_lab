import { Response } from 'express';
import { z } from 'zod';
import { PurchaseStatus, PurchasePriority } from '@prisma/client';
import { getPaginationParams } from '../utils/helpers.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as PurchasesService from '../services/purchases.service.js';
import logger from '../utils/logger.js';

// ==================== SCHEMAS ====================

const createPurchaseSchema = z.object({
  title: z.string().min(3),
  department: z.string().min(1),
  priority: z.nativeEnum(PurchasePriority).default('NORMAL'),
  justification: z.string().min(10),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().default('UN'),
    estimatedUnitPrice: z.number().min(0),
  })).min(1),
  notes: z.string().optional(),
});

const updatePurchaseSchema = z.object({
  title: z.string().min(3).optional(),
  department: z.string().min(1).optional(),
  priority: z.nativeEnum(PurchasePriority).optional(),
  justification: z.string().min(10).optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit: z.string().default('UN'),
    estimatedUnitPrice: z.number().min(0),
  })).min(1).optional(),
  notes: z.string().optional().nullable(),
});

const approveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
});

// ==================== HANDLERS ====================

export async function listPurchases(req: AuthenticatedRequest, res: Response) {
  try {
    const pagination = getPaginationParams(req.query);
    const { status, department, createdByMe, search } = req.query;

    const result = await PurchasesService.listPurchases(
      {
        status: status as PurchaseStatus | undefined,
        department: department as string | undefined,
        createdById: createdByMe === 'true' ? req.user!.id : undefined,
        search: search as string | undefined,
      },
      pagination,
    );

    res.json({ success: true, data: result.purchases, meta: result.meta });
  } catch (error) {
    logger.error('Get purchases error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getPurchaseById(req: AuthenticatedRequest, res: Response) {
  try {
    const purchase = await PurchasesService.getPurchaseById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    logger.error('Get purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createPurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createPurchaseSchema.parse(req.body);
    const purchase = await PurchasesService.createPurchase(data, req.user!.id, req.user!.email);

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function submitPurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await PurchasesService.submitPurchase(req.params.id, req.user!.id, req.user!.email);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }
    if (result.error === 'NOT_DRAFT') {
      return res.status(400).json({ success: false, error: 'Apenas rascunhos podem ser submetidos' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Submit purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function approvePurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const { action, comments } = approveSchema.parse(req.body);
    const result = await PurchasesService.approvePurchase(req.params.id, action, comments, req.user!.id, req.user!.email);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Approve purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updatePurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updatePurchaseSchema.parse(req.body);
    const result = await PurchasesService.updatePurchase(
      req.params.id,
      data,
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }
    if (result.error === 'NOT_DRAFT') {
      return res.status(400).json({ success: false, error: 'Apenas rascunhos podem ser editados' });
    }
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ success: false, error: 'Apenas o criador pode editar' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function cancelPurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await PurchasesService.cancelPurchase(
      req.params.id,
      req.body.reason,
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }
    if (result.error === 'NOT_CANCELLABLE') {
      return res.status(400).json({ success: false, error: 'Esta requisição não pode ser cancelada' });
    }
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ success: false, error: 'Apenas o criador pode cancelar' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Cancel purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function executePurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const { supplierId, invoiceNumber, items, notes } = req.body;
    const result = await PurchasesService.executePurchase(
      req.params.id,
      { supplierId, invoiceNumber, items, notes },
      req.user!.id,
      req.user!.email,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Requisição não encontrada' });
    }
    if (result.error === 'NOT_APPROVED') {
      return res.status(400).json({ success: false, error: 'Apenas requisições aprovadas podem ser executadas' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Execute purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getStatsOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const stats = await PurchasesService.getStatsOverview();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get purchase stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
