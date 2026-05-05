import { Response } from 'express';
import { z } from 'zod';
import { getPaginationParams } from '../utils/helpers.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as SuppliersService from '../services/suppliers.service.js';
import logger from '../utils/logger.js';

// ==================== SCHEMAS ====================

const createSupplierSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const updateSupplierSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// ==================== HANDLERS ====================

export async function listSuppliers(req: AuthenticatedRequest, res: Response) {
  try {
    const pagination = getPaginationParams(req.query);
    const { search, isActive } = req.query;

    const result = await SuppliersService.listSuppliers(
      {
        search: search as string | undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
      pagination,
    );

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    logger.error('Get suppliers error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getSupplierById(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await SuppliersService.getSupplierById(req.params.id);

    if ('error' in result) {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get supplier error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createSupplierSchema.parse(req.body);
    const result = await SuppliersService.createSupplier(data, req.user!.id, req.user!.email);

    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create supplier error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const data = updateSupplierSchema.parse(req.body);
    const result = await SuppliersService.updateSupplier(req.params.id, data, req.user!.id, req.user!.email);

    if ('error' in result) {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Update supplier error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function archiveSupplier(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await SuppliersService.archiveSupplier(req.params.id, req.user!.id, req.user!.email);

    if ('error' in result && result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }
    if ('error' in result && result.error === 'HAS_PENDING_ORDERS') {
      return res.status(400).json({
        success: false,
        error: 'Fornecedor possui pedidos de compra pendentes e não pode ser arquivado',
      });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Archive supplier error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function listSupplierOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await SuppliersService.listSupplierOrders(req.params.id, pagination);

    if ('error' in result) {
      return res.status(404).json({ success: false, error: 'Fornecedor não encontrado' });
    }

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    logger.error('Get supplier orders error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
