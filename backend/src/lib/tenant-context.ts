import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request tenant context, propagated transparently across async
 * boundaries via Node's AsyncLocalStorage. The HTTP and Socket.IO auth
 * middlewares wrap their `next()` invocation in `tenantContext.run({...})`,
 * and any Prisma query that fires while that promise chain is alive
 * picks up the tenantId via the auto-scoping middleware in
 * config/database.ts.
 *
 * Public-form endpoints don't go through `authenticate()` and therefore
 * have no ALS context — those code paths must resolve tenantId
 * explicitly from the entity they're operating on (e.g.
 * Lead.tenantId after looking up by applicationToken). Background
 * workers (queues, webhooks) similarly need to set context manually.
 */
export interface TenantContext {
  tenantId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContext>();

/**
 * Run `fn` with the given tenant context active. Anything called from
 * inside `fn` (including async work) sees `currentTenantId() === tenantId`.
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantContext.run({ tenantId }, fn);
}

/**
 * Returns the active tenantId, or null if no context is set. Null is the
 * normal case for code paths that haven't been wrapped (e.g. server boot,
 * tests that don't establish context). Callers that require a tenantId
 * should call `requireTenantId()` instead.
 */
export function currentTenantId(): string | null {
  return tenantContext.getStore()?.tenantId ?? null;
}

/**
 * Read the active tenantId or throw. Used by code that runs inside an
 * authenticated request and treats absence of context as a bug.
 */
export function requireTenantId(): string {
  const id = currentTenantId();
  if (!id) {
    throw new Error('Tenant context not established for this code path');
  }
  return id;
}
