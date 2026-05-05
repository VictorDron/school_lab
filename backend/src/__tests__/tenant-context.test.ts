// Phase 2b multi-tenancy: AsyncLocalStorage tenant context.

import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/database.js', () => ({ prisma: {} }));

import {
  tenantContext,
  runWithTenant,
  currentTenantId,
  requireTenantId,
  withTenantTx,
  PLATFORM_ADMIN_TENANT_GUC,
} from '../lib/tenant-context.js';

describe('tenant-context (AsyncLocalStorage)', () => {
  it('returns null when no context is established', () => {
    expect(currentTenantId()).toBeNull();
  });

  it('exposes tenantId inside runWithTenant', () => {
    const result = runWithTenant('tenant-A', () => currentTenantId());
    expect(result).toBe('tenant-A');
  });

  it('propagates context across async boundaries', async () => {
    const result = await runWithTenant('tenant-B', async () => {
      // Simulate an async hop — ALS preserves context.
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
      return currentTenantId();
    });
    expect(result).toBe('tenant-B');
  });

  it('isolates parallel runs (each gets its own context)', async () => {
    const a = runWithTenant('tenant-A', async () => {
      await new Promise((r) => setTimeout(r, 5));
      return currentTenantId();
    });
    const b = runWithTenant('tenant-B', async () => {
      await new Promise((r) => setTimeout(r, 1));
      return currentTenantId();
    });
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra).toBe('tenant-A');
    expect(rb).toBe('tenant-B');
  });

  it('reverts to null after the runWithTenant scope exits', () => {
    runWithTenant('tenant-A', () => currentTenantId());
    expect(currentTenantId()).toBeNull();
  });

  it('requireTenantId returns the value when context is set', () => {
    const id = runWithTenant('tenant-X', () => requireTenantId());
    expect(id).toBe('tenant-X');
  });

  it('requireTenantId throws a clear error when no context is set', () => {
    expect(() => requireTenantId()).toThrow(/Tenant context not established/);
  });

  it('exposes the underlying ALS instance for adapters that need it', () => {
    expect(tenantContext).toBeDefined();
    // Smoke-check: round-tripping via the ALS API directly works.
    const id = tenantContext.run({ tenantId: 'tenant-Z' }, () => currentTenantId());
    expect(id).toBe('tenant-Z');
  });
});

describe('withTenantTx (Phase 5 — RLS GUC plumbing)', () => {
  function makePrismaStub() {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const tx = {
      $executeRawUnsafe: vi.fn(async (sql: string, ...params: unknown[]) => {
        calls.push({ sql, params });
      }),
    };
    return {
      prisma: {
        $transaction: vi.fn(async (fn: any) => fn(tx)),
      },
      tx,
      calls,
    };
  }

  it('sets app.current_tenant_id to the active ALS tenant', async () => {
    const { prisma, calls } = makePrismaStub();
    await runWithTenant('tenant-A', async () => {
      await withTenantTx(prisma, async () => {});
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].sql).toContain("SET LOCAL app.current_tenant_id = 'tenant-A'");
  });

  it('sets the GUC to empty string when no ALS context is active', async () => {
    const { prisma, calls } = makePrismaStub();
    await withTenantTx(prisma, async () => {});
    expect(calls[0].sql).toContain("SET LOCAL app.current_tenant_id = ''");
  });

  it('uses the platform-admin sentinel when options.platformAdmin is true', async () => {
    const { prisma, calls } = makePrismaStub();
    await withTenantTx(prisma, async () => {}, { platformAdmin: true });
    expect(calls[0].sql).toContain(`SET LOCAL app.current_tenant_id = '${PLATFORM_ADMIN_TENANT_GUC}'`);
  });

  it('escapes single quotes in tenant ids to defang SQL injection via ALS', async () => {
    const { prisma, calls } = makePrismaStub();
    // ALS is established with a malicious string — withTenantTx must
    // double-quote it so the SET LOCAL statement stays well-formed.
    await runWithTenant("tenant'; DROP TABLE x; --", async () => {
      await withTenantTx(prisma, async () => {});
    });
    expect(calls[0].sql).toContain("SET LOCAL app.current_tenant_id = 'tenant''; DROP TABLE x; --'");
  });

  it("returns the inner function's result", async () => {
    const { prisma } = makePrismaStub();
    const result = await runWithTenant('tenant-A', () =>
      withTenantTx(prisma, async () => 42),
    );
    expect(result).toBe(42);
  });
});
