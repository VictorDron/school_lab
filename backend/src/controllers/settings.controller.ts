import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { uploadFile } from '../config/supabase.js';
import { createAuditLog } from '../services/audit.service.js';
import * as SettingsService from '../services/settings.service.js';
import { getDefaultTenant } from '../services/tenant.service.js';
import logger from '../utils/logger.js';

// Phase 0 transitional helper. Phase 1 will replace this with `req.tenantId`
// resolved by the auth middleware once the JWT carries it.
async function resolveTenantId(): Promise<string> {
  const tenant = await getDefaultTenant();
  return tenant.id;
}

export async function getSettings(_req: Request, res: Response) {
  try {
    const tenantId = await resolveTenantId();
    const settings = await SettingsService.getOrCreateSettings(tenantId);
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const { schoolName, defaultLanguage, dateFormat, currency, timezone } =
      req.body;

    const tenantId = await resolveTenantId();
    const settings = await SettingsService.updateSettings(tenantId, {
      schoolName,
      defaultLanguage,
      dateFormat,
      currency,
      timezone,
    });

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'SETTINGS_UPDATED',
        entityType: 'SETTINGS',
        entityId: settings.id,
      },
      req,
    );

    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateLogo(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: 'Arquivo obrigatório' });
    }

    const path = `system/logo-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const logoUrl = await uploadFile(req.file.buffer, path, req.file.mimetype);

    if (!logoUrl) {
      return res
        .status(500)
        .json({ success: false, error: 'Falha no upload' });
    }

    const tenantId = await resolveTenantId();
    const settings = await SettingsService.updateLogoUrl(tenantId, logoUrl);
    res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Update logo error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getFees(_req: AuthenticatedRequest, res: Response) {
  try {
    const tenantId = await resolveTenantId();
    const data = await SettingsService.getFees(tenantId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get fees error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateFees(req: AuthenticatedRequest, res: Response) {
  try {
    const { feeTable, foodTable, discountOptions } = req.body;

    const tenantId = await resolveTenantId();
    const data = await SettingsService.updateFees(tenantId, {
      feeTable,
      foodTable,
      discountOptions,
    });

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'SETTINGS_UPDATED',
        entityType: 'SETTINGS',
        entityId: data.id,
      },
      req,
    );

    const { id: _id, ...payload } = data;
    res.json({ success: true, data: payload });
  } catch (error) {
    logger.error('Update fees error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
