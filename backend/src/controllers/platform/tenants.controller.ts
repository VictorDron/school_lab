import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/index.js';
import {
  createTenant,
  listTenants,
  setTenantStatus,
} from '../../services/tenant.service.js';
import { createAuditLog } from '../../services/audit.service.js';
import logger from '../../utils/logger.js';

const createTenantSchema = z.object({
  slug: z.string().min(2).max(32),
  name: z.string().min(2),
  admin: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    displayName: z.string().optional(),
    password: z.string().min(8).optional(),
  }),
});

const setStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  TENANT_SLUG_INVALID: { status: 400, message: 'Slug inválido (use a-z, 0-9 e hífens, 2–32 chars)' },
  TENANT_SLUG_TAKEN: { status: 409, message: 'Slug já em uso' },
  TENANT_ADMIN_EMAIL_INVALID: { status: 400, message: 'Email do admin inválido' },
  TENANT_ADMIN_EMAIL_TAKEN: { status: 409, message: 'Email já cadastrado' },
};

export async function postTenant(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createTenantSchema.parse(req.body);
    const result = await createTenant(data);

    // Platform admin action — audit lives in the platform admin's own
    // tenant (req.tenantId, set by authenticate). The new tenant
    // doesn't have its own audit yet.
    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'USER_CREATED',
        entityType: 'TENANT',
        entityId: result.tenant.id,
        metadata: { slug: result.tenant.slug, adminEmail: result.admin.email },
        tenantId: req.tenantId,
      },
      req,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: err.errors });
    }
    const code = (err as Error).message;
    if (ERROR_MAP[code]) {
      return res.status(ERROR_MAP[code].status).json({ success: false, error: ERROR_MAP[code].message });
    }
    logger.error('Create tenant failed', { error: (err as Error).message });
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function getTenants(_req: AuthenticatedRequest, res: Response) {
  try {
    const tenants = await listTenants();
    res.json({ success: true, data: tenants });
  } catch (err) {
    logger.error('List tenants failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function patchTenantStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = setStatusSchema.parse(req.body);
    const tenant = await setTenantStatus(id, status);

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: 'SETTINGS_UPDATED',
        entityType: 'TENANT',
        entityId: id,
        metadata: { status },
        tenantId: req.tenantId,
      },
      req,
    );

    res.json({ success: true, data: tenant });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Status inválido' });
    }
    logger.error('Update tenant status failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
