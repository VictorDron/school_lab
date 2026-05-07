-- ==================== TENANT FOUNDATION ====================
-- Phase 0 of multi-tenancy. Adds the Tenant model + relation columns
-- without changing runtime behavior. All existing data is attached to a
-- single seed tenant (slug 'ics'). Phase 1 will wire tenantId through
-- JWT/auth so requests scope at runtime.

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Tenant" (
  "id"        TEXT          NOT NULL,
  "slug"      TEXT          NOT NULL,
  "name"      TEXT          NOT NULL,
  "status"    "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)  NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- Seed tenant for all pre-existing data. Deterministic UUID so support
-- queries can reference it; new tenants get random UUIDs from Prisma.
INSERT INTO "Tenant" ("id", "slug", "name", "status", "createdAt", "updatedAt")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ics',
  'International Christian School of Rio de Janeiro',
  'ACTIVE',
  NOW(),
  NOW()
);

-- ---------------------------------------------------------------------------
-- SystemSettings.tenantId — 1:1 with Tenant
-- ---------------------------------------------------------------------------
ALTER TABLE "SystemSettings" ADD COLUMN "tenantId" TEXT;

-- Backfill: any existing SystemSettings row points at the seed tenant.
UPDATE "SystemSettings" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;

-- Tighten constraints
ALTER TABLE "SystemSettings" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE UNIQUE INDEX "SystemSettings_tenantId_key" ON "SystemSettings"("tenantId");
ALTER TABLE "SystemSettings"
  ADD CONSTRAINT "SystemSettings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- User.tenantId + User.isPlatformAdmin
-- ---------------------------------------------------------------------------
ALTER TABLE "User" ADD COLUMN "tenantId"        TEXT;
ALTER TABLE "User" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every existing user belongs to the seed tenant.
UPDATE "User" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;

CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
