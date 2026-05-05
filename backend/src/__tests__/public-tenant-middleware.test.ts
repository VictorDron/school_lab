// Phase 3a — public form tenant resolution middleware.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    lead: { findUnique: vi.fn() },
    reEnrollmentInvite: { findUnique: vi.fn() },
    preReEnrollmentResponse: { findUnique: vi.fn() },
    tenant: { findUnique: vi.fn() },
  },
}));

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { currentTenantId } from '../lib/tenant-context.js';
import {
  withTenantFromToken,
  applicationTokenResolver,
  enrollmentTokenResolver,
  reEnrollmentInviteTokenResolver,
  preReEnrollmentTokenResolver,
} from '../middlewares/public-tenant.js';

function makeReq(overrides: any = {}): any {
  return { params: {}, body: {}, ...overrides };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('withTenantFromToken (Phase 3a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enters runWithTenant with the resolved tenantId on success', async () => {
    const middleware = withTenantFromToken(async () => 'tenant-A');
    const req = makeReq();
    const res = makeRes();
    let observedTenant: string | null | undefined;
    const next = () => {
      observedTenant = currentTenantId();
    };

    await middleware(req, res, next);

    expect(observedTenant).toBe('tenant-A');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects with 404 when resolver returns null and onMissing=reject', async () => {
    const middleware = withTenantFromToken(async () => null, { onMissing: 'reject' });
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to default tenant when resolver returns null and onMissing=fallback', async () => {
    prismaMock.tenant.findUnique.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      slug: 'ics',
      name: 'Seed',
    });

    const middleware = withTenantFromToken(async () => null, { onMissing: 'fallback' });
    const req = makeReq();
    const res = makeRes();
    let observedTenant: string | null | undefined;
    const next = () => {
      observedTenant = currentTenantId();
    };

    await middleware(req, res, next);

    expect(observedTenant).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('does not leak ALS context after the handler chain returns', async () => {
    const middleware = withTenantFromToken(async () => 'tenant-A');
    const req = makeReq();
    const res = makeRes();

    await middleware(req, res, () => {});

    expect(currentTenantId()).toBeNull();
  });
});

describe('applicationTokenResolver', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves Lead.tenantId from URL :token param', async () => {
    prismaMock.lead.findUnique.mockResolvedValue({ tenantId: 'tenant-X' });
    const id = await applicationTokenResolver(makeReq({ params: { token: 'tk-1' } }));
    expect(id).toBe('tenant-X');
    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: { applicationToken: 'tk-1' },
      select: { tenantId: true },
    });
  });

  it('resolves from body.applicationToken when no URL param', async () => {
    prismaMock.lead.findUnique.mockResolvedValue({ tenantId: 'tenant-Y' });
    const id = await applicationTokenResolver(makeReq({ body: { applicationToken: 'tk-2' } }));
    expect(id).toBe('tenant-Y');
  });

  it('returns null when token is missing entirely', async () => {
    const id = await applicationTokenResolver(makeReq());
    expect(id).toBeNull();
    expect(prismaMock.lead.findUnique).not.toHaveBeenCalled();
  });

  it('returns null when no Lead matches the token', async () => {
    prismaMock.lead.findUnique.mockResolvedValue(null);
    const id = await applicationTokenResolver(makeReq({ params: { token: 'unknown' } }));
    expect(id).toBeNull();
  });
});

describe('enrollmentTokenResolver', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves Lead.tenantId via enrollmentToken', async () => {
    prismaMock.lead.findUnique.mockResolvedValue({ tenantId: 'tenant-Z' });
    const id = await enrollmentTokenResolver(makeReq({ params: { token: 'en-1' } }));
    expect(id).toBe('tenant-Z');
    expect(prismaMock.lead.findUnique).toHaveBeenCalledWith({
      where: { enrollmentToken: 'en-1' },
      select: { tenantId: true },
    });
  });
});

describe('reEnrollmentInviteTokenResolver', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves ReEnrollmentInvite.tenantId from :token', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({ tenantId: 'tenant-Q' });
    const id = await reEnrollmentInviteTokenResolver(makeReq({ params: { token: 'inv-1' } }));
    expect(id).toBe('tenant-Q');
  });
});

describe('preReEnrollmentTokenResolver', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves PreReEnrollmentResponse.tenantId from :token', async () => {
    prismaMock.preReEnrollmentResponse.findUnique.mockResolvedValue({ tenantId: 'tenant-W' });
    const id = await preReEnrollmentTokenResolver(makeReq({ params: { token: 'pre-1' } }));
    expect(id).toBe('tenant-W');
  });
});
