// Phase 3b — tenant onboarding API (createTenant + listTenants).

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const tx = {
    tenant: { create: vi.fn() },
    systemSettings: { create: vi.fn() },
    user: { create: vi.fn() },
  };
  return {
    prismaMock: {
      tenant: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
      user: { findUnique: vi.fn() },
      $transaction: vi.fn(async (fn: any) => fn(tx)),
      __tx: tx,
    },
  };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock('../utils/helpers.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

import {
  createTenant,
  listTenants,
  setTenantStatus,
} from '../services/tenant.service.js';

describe('createTenant (Phase 3b)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an invalid slug', async () => {
    await expect(
      createTenant({
        slug: 'NOT-OK!',
        name: 'Acme',
        admin: { email: 'a@b.com', fullName: 'Admin' },
      }),
    ).rejects.toThrow('TENANT_SLUG_INVALID');
  });

  it('rejects when slug is already taken', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({ id: 'other', slug: 'acme' });
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(
      createTenant({ slug: 'acme', name: 'Acme', admin: { email: 'a@b.com', fullName: 'Admin' } }),
    ).rejects.toThrow('TENANT_SLUG_TAKEN');
  });

  it('rejects when admin email is already used by an existing user', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'a@b.com' });
    await expect(
      createTenant({ slug: 'acme', name: 'Acme', admin: { email: 'a@b.com', fullName: 'Admin' } }),
    ).rejects.toThrow('TENANT_ADMIN_EMAIL_TAKEN');
  });

  it('creates Tenant + SystemSettings + admin user atomically on success', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.__tx.tenant.create.mockResolvedValue({
      id: 't-1',
      slug: 'acme',
      name: 'Acme',
      status: 'ACTIVE',
    });
    prismaMock.__tx.systemSettings.create.mockResolvedValue({});
    prismaMock.__tx.user.create.mockResolvedValue({ id: 'u-1', email: 'a@b.com' });

    const result = await createTenant({
      slug: 'Acme',
      name: 'Acme',
      admin: { email: 'A@B.com', fullName: 'Admin', password: 'sup3r-secret' },
    });

    expect(result.tenant.slug).toBe('acme');
    expect(result.admin.email).toBe('a@b.com');
    expect(prismaMock.__tx.tenant.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'acme' }) }),
    );
    expect(prismaMock.__tx.systemSettings.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 't-1' }) }),
    );
    expect(prismaMock.__tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 't-1',
          email: 'a@b.com',
          passwordHash: 'hashed-password',
          requirePasswordChange: false,
        }),
      }),
    );
  });

  it('marks the admin requirePasswordChange=true when no password is given', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.__tx.tenant.create.mockResolvedValue({ id: 't-2', slug: 's', name: 'S', status: 'ACTIVE' });
    prismaMock.__tx.systemSettings.create.mockResolvedValue({});
    prismaMock.__tx.user.create.mockResolvedValue({ id: 'u-2', email: 'a@b.com' });

    await createTenant({ slug: 's', name: 'S', admin: { email: 'a@b.com', fullName: 'Admin' } });

    const userCreateArgs = prismaMock.__tx.user.create.mock.calls[0][0];
    expect(userCreateArgs.data.passwordHash).toBeNull();
    expect(userCreateArgs.data.requirePasswordChange).toBe(true);
  });
});

describe('listTenants', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns tenants with user/lead counts', async () => {
    prismaMock.tenant.findMany.mockResolvedValue([
      { id: 't-1', slug: 'acme', name: 'Acme', status: 'ACTIVE', _count: { users: 3, leads: 12 } },
    ]);
    const result = await listTenants();
    expect(result).toHaveLength(1);
    expect(result[0]._count.leads).toBe(12);
  });
});

describe('setTenantStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('flips status to SUSPENDED', async () => {
    prismaMock.tenant.update.mockResolvedValue({ id: 't-1', slug: 'acme', status: 'SUSPENDED' });
    const result = await setTenantStatus('t-1', 'SUSPENDED');
    expect(result.status).toBe('SUSPENDED');
  });
});
