// Phase 2a multi-tenancy: Invite tenant scoping.
//
// Verifies:
//   1. Invite creation stamps tenantId from req.tenantId.
//   2. User registration via invite reads invite.tenantId and lands the
//      new user in that tenant.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    invite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    moduleAccess: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    systemSettings: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
  return { prismaMock };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));
vi.mock('../config/index.js', () => ({
  config: {
    jwt: { secret: 'test-secret', expiresIn: '24h' },
    frontendUrl: 'http://localhost:5173',
  },
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock('../utils/helpers.js', async () => {
  const actual = await vi.importActual<typeof import('../utils/helpers.js')>(
    '../utils/helpers.js',
  );
  return {
    ...actual,
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    generateInviteToken: vi.fn().mockReturnValue('test-invite-token'),
  };
});
vi.mock('../services/audit.service.js', () => ({
  createAuditLog: vi.fn(),
}));
// Mock email.service to bypass the eager Resend client init (which reads
// config.resend.apiKey at module load and would NPE under test config).
vi.mock('../services/email.service.js', () => ({
  sendInviteEmail: vi.fn().mockResolvedValue({ success: true }),
}));

import * as AuthController from '../controllers/auth.controller.js';

function makeReq(overrides: Partial<any> = {}): any {
  return {
    body: {},
    user: { id: 'admin-user', email: 'admin@example.com' },
    tenantId: 'tenant-A',
    headers: {},
    ...overrides,
  };
}

function makeRes() {
  const res: any = { statusCode: 200, body: undefined };
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

describe('createInvite — tenant stamping (Phase 2a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stamps the invite with the calling admin's tenantId", async () => {
    prismaMock.invite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.invite.create.mockResolvedValue({
      id: 'invite-1',
      email: 'newuser@example.com',
      tenantId: 'tenant-A',
    });

    const req = makeReq({
      body: { email: 'newuser@example.com', name: 'New User', role: 'STAFF' },
      tenantId: 'tenant-A',
    });
    const res = makeRes();

    await AuthController.createInvite(req, res);

    expect(prismaMock.invite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          tenantId: 'tenant-A',
          invitedBy: 'admin-user',
        }),
      }),
    );
  });

  it('rejects with 401 when req.tenantId is missing', async () => {
    prismaMock.invite.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = makeReq({
      body: { email: 'newuser@example.com', name: 'New User', role: 'STAFF' },
      tenantId: undefined,
    });
    const res = makeRes();

    await AuthController.createInvite(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(prismaMock.invite.create).not.toHaveBeenCalled();
  });
});

describe('register — tenant inheritance (Phase 2a)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lands the new user in the same tenant as the invite', async () => {
    prismaMock.invite.findUnique.mockResolvedValue({
      id: 'invite-1',
      email: 'newuser@example.com',
      role: 'STAFF',
      token: 'test-invite-token',
      tenantId: 'tenant-B',
      usedAt: null,
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-new',
      email: 'newuser@example.com',
      tenantId: 'tenant-B',
    });
    prismaMock.invite.update.mockResolvedValue({});

    const req = makeReq({
      body: {
        token: 'test-invite-token',
        password: 'sup3r-secret',
        fullName: 'New User',
        displayName: 'New',
      },
      user: undefined,
      tenantId: undefined, // anonymous public route
    });
    const res = makeRes();

    await AuthController.register(req, res);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          tenantId: 'tenant-B',
          role: 'STAFF',
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
