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

/**
 * Sentinel set in Postgres' app.current_tenant_id GUC for platform admin
 * sessions. The RLS policy installed by migration 20260505120000_phase_5_rls
 * matches this value to bypass tenant filtering. Keep in sync with that
 * migration.
 */
export const PLATFORM_ADMIN_TENANT_GUC = '__platform_admin__';

// Loose structural type — keeps the helper independent of the @prisma/client
// version. The runtime contract is just: a `$transaction(callback, options?)`
// that hands back a tx with `$executeRawUnsafe`.
type TxClient = {
  $executeRawUnsafe: (sql: string, ...args: unknown[]) => Promise<unknown>;
} & Record<string, any>;
type TxOptions = {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: unknown;
};
// PrismaClient's `$transaction` is overloaded (callback or array form),
// which makes a precise structural type painful. We accept anything and
// validate the contract at runtime instead.
type PrismaLike = { $transaction: (...args: any[]) => any };

/**
 * Phase 5: run `fn` inside a Postgres transaction with the
 * `app.current_tenant_id` GUC set to the active ALS tenant. When ALS
 * has no context, the GUC is set to empty string — RLS policies treat
 * that as the permissive-when-unset case (legacy code keeps working).
 *
 * Use this for code paths that need DB-enforced tenant isolation
 * (audit log writes, cross-table operations where a malicious or buggy
 * findUnique could leak). Most reads are already covered by the
 * application-level auto-scope middleware in config/database.ts.
 *
 * `txOptions` are forwarded to Prisma's `$transaction` (maxWait, timeout,
 * isolationLevel). `platformAdmin` swaps the GUC value to the sentinel
 * that bypasses RLS for cross-tenant operations.
 */
export async function withTenantTx<T, Tx = any>(
  prisma: PrismaLike,
  fn: (tx: Tx) => Promise<T>,
  options?: { platformAdmin?: boolean; txOptions?: TxOptions },
): Promise<T> {
  const guc = options?.platformAdmin
    ? PLATFORM_ADMIN_TENANT_GUC
    : currentTenantId() ?? '';
  return prisma.$transaction(async (tx: any) => {
    // SET LOCAL is transaction-scoped — auto-resets on commit/rollback,
    // so the connection is safe to return to the pool.
    await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${guc.replace(/'/g, "''")}'`);
    return fn(tx as Tx);
  }, options?.txOptions);
}
