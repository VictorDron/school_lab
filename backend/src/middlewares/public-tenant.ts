import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { runWithTenant } from '../lib/tenant-context.js';
import { getDefaultTenant } from '../services/tenant.service.js';
import logger from '../utils/logger.js';

/**
 * Phase 3a — public form tenant resolution.
 *
 * Public endpoints don't go through `authenticate()` so they have no JWT
 * and no ALS context. Without context, the auto-scope Prisma middleware
 * is a no-op and queries can leak across tenants. This module supplies a
 * pre-handler middleware that resolves tenantId from whatever entity the
 * token points at (Lead via application/enrollment token, ReEnrollmentInvite,
 * PreReEnrollmentResponse) and wraps the rest of the request in
 * `runWithTenant`.
 *
 * Resolver lookups are intentionally `findUnique` on token columns: those
 * columns are unique-indexed and the auto-scope middleware skips findUnique
 * by design — so we can read the entity's tenantId without already being
 * in a tenant context (chicken-and-egg solved).
 *
 * For new-submission POSTs (no entity exists yet), the resolver returns
 * null and the middleware falls back to the default tenant via
 * `getDefaultTenant()`. Phase 3b will replace that fallback with
 * subdomain-based routing once the SaaS onboarding flow lands.
 */

export type TenantResolver = (req: Request) => Promise<string | null>;

export interface WithTenantOptions {
  /**
   * What to do when the resolver returns null:
   *   - 'fallback': enter context with the default tenant. Use for
   *     endpoints that may legitimately be invoked without a known
   *     entity (initial form submission).
   *   - 'reject': respond 404 and stop. Use for endpoints that must
   *     have a valid token (token-only access to existing data).
   */
  onMissing: 'fallback' | 'reject';
}

export function withTenantFromToken(
  resolver: TenantResolver,
  options: WithTenantOptions = { onMissing: 'reject' },
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    let tenantId: string | null = null;
    try {
      tenantId = await resolver(req);
    } catch (err) {
      logger.warn('Public tenant resolver failed', {
        path: req.path,
        error: (err as Error).message,
      });
      tenantId = null;
    }

    if (!tenantId) {
      if (options.onMissing === 'reject') {
        return res.status(404).json({
          success: false,
          error: 'Token inválido ou expirado',
        });
      }
      // Fallback to default tenant. TODO(Phase 3b): replace with
      // subdomain → Tenant resolution once onboarding lands.
      try {
        tenantId = (await getDefaultTenant()).id;
      } catch (err) {
        logger.error('Default tenant fallback failed', { error: (err as Error).message });
        return res.status(500).json({ success: false, error: 'Erro interno' });
      }
    }

    runWithTenant(tenantId, () => next());
  };
}

// ---------------------------------------------------------------------------
// Resolvers — one per public flow's token shape.
// ---------------------------------------------------------------------------

/** URL :token (or body.applicationToken on POST /admissions) → Lead.tenantId */
export const applicationTokenResolver: TenantResolver = async (req) => {
  const token = req.params.token || req.body?.applicationToken;
  if (!token) return null;
  const lead = await prisma.lead.findUnique({
    where: { applicationToken: token },
    select: { tenantId: true },
  });
  return lead?.tenantId ?? null;
};

/** URL :token (or body.enrollmentToken) → Lead.tenantId */
export const enrollmentTokenResolver: TenantResolver = async (req) => {
  const token = req.params.token || req.body?.enrollmentToken;
  if (!token) return null;
  const lead = await prisma.lead.findUnique({
    where: { enrollmentToken: token },
    select: { tenantId: true },
  });
  return lead?.tenantId ?? null;
};

/** URL :token → ReEnrollmentInvite.tenantId */
export const reEnrollmentInviteTokenResolver: TenantResolver = async (req) => {
  const token = req.params.token;
  if (!token) return null;
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { token },
    select: { tenantId: true },
  });
  return invite?.tenantId ?? null;
};

/** URL :token → PreReEnrollmentResponse.tenantId */
export const preReEnrollmentTokenResolver: TenantResolver = async (req) => {
  const token = req.params.token;
  if (!token) return null;
  const response = await prisma.preReEnrollmentResponse.findUnique({
    where: { token },
    select: { tenantId: true },
  });
  return response?.tenantId ?? null;
};

/**
 * Phase 3b: subdomain → Tenant.id. Looks at the leftmost label of
 * req.hostname (e.g. "acme.school-lab.com.br" → "acme"). Returns null
 * for hostnames that are obviously not subdomain-formatted (localhost,
 * single-label hosts) or for reserved labels (www/api/app), so the
 * next resolver in the chain gets a chance.
 */
const SUBDOMAIN_BYPASS = new Set(['localhost', 'www', 'api', 'app']);

export const subdomainTenantResolver: TenantResolver = async (req) => {
  const host = (req.hostname || '').toLowerCase();
  if (!host || !host.includes('.')) return null;
  const slug = host.split('.')[0];
  if (!slug || SUBDOMAIN_BYPASS.has(slug)) return null;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(slug)) return null;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });
  return tenant?.id ?? null;
};

/**
 * Compose resolvers — try each in order, first non-null wins. Useful
 * for "token first, then subdomain" so an existing entity always wins,
 * but a fresh POST /admissions resolves via subdomain.
 */
export function composeResolvers(...resolvers: TenantResolver[]): TenantResolver {
  return async (req) => {
    for (const r of resolvers) {
      const id = await r(req);
      if (id) return id;
    }
    return null;
  };
}
