import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    tenant: {
      findUnique: vi.fn(),
    },
  };
  return { prismaMock };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));

import {
  getTenantBySlug,
  getDefaultTenant,
  DEFAULT_TENANT_ID,
  DEFAULT_TENANT_SLUG,
} from '../services/tenant.service.js';

const seedTenant = {
  id: DEFAULT_TENANT_ID,
  slug: DEFAULT_TENANT_SLUG,
  name: 'International Christian School of Rio de Janeiro',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('tenant.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenantBySlug', () => {
    it('returns the tenant when found', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(seedTenant);
      const tenant = await getTenantBySlug('ics');
      expect(tenant).toEqual(seedTenant);
      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({ where: { slug: 'ics' } });
    });

    it('returns null when not found', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);
      const tenant = await getTenantBySlug('nonexistent');
      expect(tenant).toBeNull();
    });
  });

  describe('getDefaultTenant', () => {
    it('looks up the seed tenant by deterministic id', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(seedTenant);
      const tenant = await getDefaultTenant();
      expect(tenant.id).toBe(DEFAULT_TENANT_ID);
      expect(prismaMock.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: DEFAULT_TENANT_ID },
      });
    });

    it('throws a clear error when the seed row is missing', async () => {
      prismaMock.tenant.findUnique.mockResolvedValue(null);
      await expect(getDefaultTenant()).rejects.toThrow(/Default tenant.*not found/);
      await expect(getDefaultTenant()).rejects.toThrow(/prisma migrate/);
    });
  });

  describe('module constants', () => {
    it('exposes the seed identifiers used by Phase 0 fallbacks', () => {
      expect(DEFAULT_TENANT_ID).toBe('00000000-0000-0000-0000-000000000001');
      expect(DEFAULT_TENANT_SLUG).toBe('ics');
    });
  });
});
