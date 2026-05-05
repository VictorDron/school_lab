// Phase 2b multi-tenancy: AsyncLocalStorage tenant context.

import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/database.js', () => ({ prisma: {} }));

import {
  tenantContext,
  runWithTenant,
  currentTenantId,
  requireTenantId,
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
