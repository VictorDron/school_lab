import { prisma } from '../config/database.js';
import type { Tenant } from '@prisma/client';

/**
 * Deterministic UUID for the seed tenant created by migration
 * 20260505040000_add_tenant_foundation. The migration backfills every
 * pre-existing row with this id, so any code path that doesn't yet have
 * a request-scoped tenantId can fall back to this value during Phase 0.
 *
 * Phase 1 wires tenantId through auth and removes the need for this
 * fallback in production code; tests will keep using it.
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_TENANT_SLUG = 'ics';

/**
 * Look up a tenant by its URL slug. Returns null when not found so
 * callers can decide between 404 and "create on first sight" semantics.
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { slug } });
}

/**
 * Resolve the seed/default tenant. Used by code paths during Phase 0 that
 * pre-date the request-scoped tenantId plumbing — e.g. `getOrCreateSettings`
 * callers that don't yet receive `req.tenantId`.
 *
 * Throws if the seed row is missing — that means the foundation migration
 * never ran on this database, which is a fatal misconfiguration.
 */
export async function getDefaultTenant(): Promise<Tenant> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: DEFAULT_TENANT_ID },
  });
  if (!tenant) {
    throw new Error(
      `Default tenant ${DEFAULT_TENANT_ID} not found. ` +
        `Run prisma migrate to apply 20260505040000_add_tenant_foundation.`,
    );
  }
  return tenant;
}
