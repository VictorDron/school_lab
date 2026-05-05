import { Response } from 'express';
import { z } from 'zod';
import { AssetStatus } from '@prisma/client';
import { getPaginationParams } from '../utils/helpers.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as AssetsService from '../services/assets.service.js';
import logger from '../utils/logger.js';

// ==================== SCHEMAS ====================

const createAssetSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string(),
  locationId: z.string(),
  status: z.nativeEnum(AssetStatus).default('AVAILABLE'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  acquisitionDate: z.string().optional(),
  acquisitionValue: z.number().optional(),
  warranty: z.string().optional(),
  notes: z.string().optional(),
});

// ==================== CORE CRUD + OPERATIONS ====================

export async function listAssets(req: AuthenticatedRequest, res: Response) {
  try {
    const pagination = getPaginationParams(req.query);
    const { status, categoryId, locationId, responsibleId, search } = req.query;

    const result = await AssetsService.listAssets(
      {
        status: status as AssetStatus | undefined,
        categoryId: categoryId as string | undefined,
        locationId: locationId as string | undefined,
        responsibleId: responsibleId as string | undefined,
        search: search as string | undefined,
      },
      pagination,
    );

    res.json({ success: true, data: result.assets, meta: result.meta });
  } catch (error) {
    logger.error('Get assets error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getAssetById(req: AuthenticatedRequest, res: Response) {
  try {
    const asset = await AssetsService.getAssetById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

    res.json({ success: true, data: asset });
  } catch (error) {
    logger.error('Get asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createAssetSchema.parse(req.body);
    const asset = await AssetsService.createAsset(data, req.user!.id, req.user!.email);

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function moveAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { locationId, reason } = req.body;
    const result = await AssetsService.moveAsset(req.params.id, locationId, reason, req.user!.id, req.user!.email);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }
    if (result.error === 'SAME_LOCATION') {
      return res.status(400).json({ success: false, error: 'Ativo já está nesta localização' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Move asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function assignAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId } = req.body;
    const result = await AssetsService.assignAsset(req.params.id, userId, req.user!.id, req.user!.email);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Assign asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, categoryId, locationId, brand, model: assetModel, serialNumber, acquisitionDate, acquisitionValue, currentValue, warranty, notes, depreciationRate } = req.body;

    const result = await AssetsService.updateAsset(
      req.params.id,
      { name, description, categoryId, locationId, brand, model: assetModel, serialNumber, acquisitionDate, acquisitionValue, currentValue, warranty, notes, depreciationRate },
      req.user!.id,
      req.user!.email,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Update asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function decommissionAsset(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.decommissionAsset(req.params.id, req.body.reason, req.user!.id, req.user!.email);

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }
    if (result.error === 'ALREADY_DECOMMISSIONED') {
      return res.status(400).json({ success: false, error: 'Ativo já está desativado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Decommission asset error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== INVENTORY ====================

export async function listInventorySessions(req: AuthenticatedRequest, res: Response) {
  try {
    const sessions = await AssetsService.listInventorySessions();
    res.json({ success: true, data: sessions });
  } catch (error) {
    logger.error('Get inventory sessions error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createInventorySession(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, locationId, categoryId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório' });
    }

    const session = await AssetsService.createInventorySession(
      { name, description, locationId, categoryId },
      req.user!.id,
      req.user!.email,
    );

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error('Create inventory error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getInventorySession(req: AuthenticatedRequest, res: Response) {
  try {
    const session = await AssetsService.getInventorySession(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Sessão não encontrada' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    logger.error('Get inventory session error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function startInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.startInventory(req.params.sessionId, req.user!.id);

    if (result.error === 'INVALID_SESSION') {
      return res.status(400).json({ success: false, error: 'Sessão inválida ou já iniciada' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Start inventory error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function checkInventoryItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, notes } = req.body;
    if (!['FOUND', 'NOT_FOUND'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }

    const result = await AssetsService.checkInventoryItem(
      req.params.sessionId,
      req.params.itemId,
      { status, notes },
      req.user!.id,
      req.user!.email,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Item não encontrado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Check inventory item error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function completeInventory(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.completeInventory(req.params.sessionId, req.user!.id, req.user!.email);

    if (result.error === 'INVALID_SESSION') {
      return res.status(400).json({ success: false, error: 'Sessão inválida' });
    }
    if (result.error === 'PENDING_ITEMS') {
      return res.status(400).json({ success: false, error: `Ainda há ${result.pendingCount} item(ns) pendente(s)` });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Complete inventory error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== MAINTENANCE ====================

export async function getUpcomingMaintenance(req: AuthenticatedRequest, res: Response) {
  try {
    const maintenance = await AssetsService.getUpcomingMaintenance();
    res.json({ success: true, data: maintenance });
  } catch (error) {
    logger.error('Get upcoming maintenance error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getOverdueMaintenance(req: AuthenticatedRequest, res: Response) {
  try {
    const maintenance = await AssetsService.getOverdueMaintenance();
    res.json({ success: true, data: maintenance });
  } catch (error) {
    logger.error('Get overdue maintenance error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getMaintenanceHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const maintenance = await AssetsService.getMaintenanceHistory(req.params.id);
    res.json({ success: true, data: maintenance });
  } catch (error) {
    logger.error('Get maintenance error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createMaintenance(req: AuthenticatedRequest, res: Response) {
  try {
    const { type, description, scheduledDate, priority, vendor, notes, cost } = req.body;

    const result = await AssetsService.createMaintenance(
      req.params.id,
      { type, description, scheduledDate, priority, vendor, notes, cost },
      req.user!.id,
      req.user!.email,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Ativo não encontrado' });
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Create maintenance error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function completeMaintenance(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.completeMaintenance(
      req.params.id,
      req.params.maintenanceId,
      { cost: req.body.cost, notes: req.body.notes },
      req.user!.id,
      req.user!.email,
    );

    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Manutenção não encontrada' });
    }
    if (result.error === 'ALREADY_COMPLETED') {
      return res.status(400).json({ success: false, error: 'Manutenção já concluída' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Complete maintenance error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== CONFIG: CATEGORIES ====================

export async function listCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const categories = await AssetsService.listCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, icon } = req.body;
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório (min 2 caracteres)' });
    }

    const category = await AssetsService.createCategory({ name, description, icon }, req.user!.id, req.user!.email);
    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Categoria já existe' });
    }
    logger.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, icon } = req.body;
    const updated = await AssetsService.updateCategory(req.params.categoryId, { name, description, icon }, req.user!.id, req.user!.email);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.deleteCategory(req.params.categoryId, req.user!.id, req.user!.email);

    if (result.error === 'HAS_ASSETS') {
      return res.status(400).json({ success: false, error: `Não é possível excluir: ${result.assetCount} ativo(s) vinculado(s)` });
    }

    res.json({ success: true, message: 'Categoria removida' });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== CONFIG: LOCATIONS ====================

export async function listLocations(req: AuthenticatedRequest, res: Response) {
  try {
    const locations = await AssetsService.listLocations();
    res.json({ success: true, data: locations });
  } catch (error) {
    logger.error('Get locations error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, parentId } = req.body;
    if (!name || name.length < 2) {
      return res.status(400).json({ success: false, error: 'Nome é obrigatório (min 2 caracteres)' });
    }

    const location = await AssetsService.createLocation({ name, description, parentId }, req.user!.id, req.user!.email);
    res.status(201).json({ success: true, data: location });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Localização já existe' });
    }
    logger.error('Create location error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, description, parentId } = req.body;
    const updated = await AssetsService.updateLocation(req.params.locationId, { name, description, parentId }, req.user!.id, req.user!.email);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await AssetsService.deleteLocation(req.params.locationId, req.user!.id, req.user!.email);

    if (result.error === 'HAS_ASSETS') {
      return res.status(400).json({ success: false, error: `Não é possível excluir: ${result.assetCount} ativo(s) vinculado(s)` });
    }
    if (result.error === 'HAS_CHILDREN') {
      return res.status(400).json({ success: false, error: `Não é possível excluir: ${result.childCount} sublocalização(ões) vinculada(s)` });
    }

    res.json({ success: true, message: 'Localização removida' });
  } catch (error) {
    logger.error('Delete location error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== STATS ====================

export async function getStatsOverview(req: AuthenticatedRequest, res: Response) {
  try {
    const stats = await AssetsService.getStatsOverview();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Get asset stats error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
