import { prisma } from '../config/database.js';
import type { Tenant, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/helpers.js';

/**
 * Deterministic UUID for the seed tenant created by migration
 * 20260505040000_add_tenant_foundation. The migration backfills every
 * pre-existing row with this id, so any code path that doesn't yet have
 * a request-scoped tenantId can fall back to this value during Phase 0.
 *
 * Phase 1 wires tenantId through auth and removes the need for this
 * fallback in production code; tests will keep using it.
 */
export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_TENANT_SLUG = 'ics';

/**
 * Look up a tenant by its URL slug. Returns null when not found so
 * callers can decide between 404 and "create on first sight" semantics.
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { slug } });
}

/**
 * Resolve the seed/default tenant. Used by code paths during Phase 0 that
 * pre-date the request-scoped tenantId plumbing — e.g. `getOrCreateSettings`
 * callers that don't yet receive `req.tenantId`.
 *
 * Throws if the seed row is missing — that means the foundation migration
 * never ran on this database, which is a fatal misconfiguration.
 */
export async function getDefaultTenant(): Promise<Tenant> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: DEFAULT_TENANT_ID },
  });
  if (!tenant) {
    throw new Error(
      `Default tenant ${DEFAULT_TENANT_ID} not found. ` +
        `Run prisma migrate to apply 20260505040000_add_tenant_foundation.`,
    );
  }
  return tenant;
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export interface CreateTenantInput {
  slug: string;
  name: string;
  admin: {
    email: string;
    fullName: string;
    displayName?: string;
    /**
     * Plaintext password. If omitted, the user is created with no
     * password and `requirePasswordChange = true` — the platform admin
     * is expected to send an invite separately.
     */
    password?: string;
    role?: UserRole;
  };
}

export interface CreateTenantResult {
  tenant: Tenant;
  admin: {
    id: string;
    email: string;
  };
}

/**
 * Phase 3b: provision a new tenant + first admin user atomically.
 *
 * Validates slug shape and uniqueness, creates the Tenant row, the
 * default SystemSettings row (so getOrCreateSettings doesn't have to
 * race), and the initial admin user with isPlatformAdmin=false (a
 * platform admin can promote later if needed). Wraps everything in a
 * transaction so a partial failure leaves no orphan rows.
 */
export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error('TENANT_SLUG_INVALID');
  }

  const email = input.admin.email.trim().toLowerCase();
  if (!email.includes('@')) {
    throw new Error('TENANT_ADMIN_EMAIL_INVALID');
  }

  const [existingTenant, existingUser] = await Promise.all([
    prisma.tenant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existingTenant) throw new Error('TENANT_SLUG_TAKEN');
  if (existingUser) throw new Error('TENANT_ADMIN_EMAIL_TAKEN');

  const passwordHash = input.admin.password
    ? await hashPassword(input.admin.password)
    : null;

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        slug,
        name: input.name.trim(),
        status: 'ACTIVE',
      },
    });

    await tx.systemSettings.create({
      data: {
        tenantId: tenant.id,
        schoolName: input.name.trim(),
      },
    });

    const admin = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        passwordHash,
        fullName: input.admin.fullName,
        displayName: input.admin.displayName ?? input.admin.fullName,
        role: input.admin.role ?? 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        requirePasswordChange: !input.admin.password,
      },
      select: { id: true, email: true },
    });

    return { tenant, admin };
  });
}

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      createdAt: true,
      _count: { select: { users: true, leads: true } },
    },
  });
}

export async function setTenantStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
  return prisma.tenant.update({
    where: { id },
    data: { status },
    select: { id: true, slug: true, status: true },
  });
}
