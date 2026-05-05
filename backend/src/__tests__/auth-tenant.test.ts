// Phase 1 multi-tenancy: auth middleware tenant integrity.
//
// Verifies the middleware:
//   1. Sets req.tenantId from the user record after token verification.
//   2. Rejects a token whose tenantId disagrees with the user's tenantId.
//   3. Lets platform admins skip the integrity check (they cross-tenant).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const { prismaMock, configMock } = vi.hoisted(() => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  };
  const configMock = {
    config: {
      jwt: { secret: 'test-secret', expiresIn: '24h' },
    },
  };
  return { prismaMock, configMock };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock('../config/index.js', () => configMock);
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { authenticate } from '../middlewares/auth.js';

function makeReq(token?: string): any {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  };
}

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: any) => {
    res.body = body;
    return res;
  });
  return res;
}

const baseUser = {
  id: 'user-1',
  email: 'admin@example.com',
  displayName: 'Admin',
  fullName: 'Admin Full',
  role: 'ADMIN',
  status: 'ACTIVE',
  tenantId: 'tenant-A',
  isPlatformAdmin: false,
  moduleAccess: [],
};

function signToken(payload: object) {
  return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
}

describe('authenticate — tenant integrity (Phase 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets req.tenantId from the user record on a valid token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    const token = signToken({ userId: 'user-1', email: 'admin@example.com', role: 'ADMIN', tenantId: 'tenant-A' });
    const req = makeReq(token);
    const res = makeRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.tenantId).toBe('tenant-A');
    expect(req.user).toMatchObject({ id: 'user-1', tenantId: 'tenant-A' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a token whose tenantId does not match the user record', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    // Token claims tenant-B but the user is in tenant-A.
    const token = signToken({ userId: 'user-1', email: 'admin@example.com', role: 'ADMIN', tenantId: 'tenant-B' });
    const req = makeReq(token);
    const res = makeRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toMatch(/tenant mismatch/i);
  });

  it('lets platform admins bypass the tenant integrity check', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      isPlatformAdmin: true,
      tenantId: 'tenant-A',
    });
    // Token claims a different tenant — platform admin can cross-tenant.
    const token = signToken({ userId: 'user-1', email: 'admin@example.com', role: 'ADMIN', tenantId: 'tenant-B' });
    const req = makeReq(token);
    const res = makeRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user.isPlatformAdmin).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is present', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when the token is malformed', async () => {
    const req = makeReq('not-a-real-token');
    const res = makeRes();
    const next = vi.fn();

    await authenticate(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
