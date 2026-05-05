/**
 * Audit-log tenant resolution helpers, separated from tenant-context.ts so
 * audit.service can pull them without importing the whole ALS module
 * (audit gets called from very low-level code paths that may not have
 * context yet).
 */
export { currentTenantId } from './tenant-context.js';

/**
 * Used as a final fallback by createAuditLog when no tenantId can be
 * resolved (no explicit override, no ALS context, no actor user). This
 * is the seed tenant — single-tenant deployments will never hit it; in
 * production multi-tenant, callers should pass tenantId explicitly when
 * the event fires before auth (e.g. LOGIN_FAILURE).
 */
export const DEFAULT_TENANT_ID_FALLBACK = '00000000-0000-0000-0000-000000000001';
