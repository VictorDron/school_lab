-- ==================== PHASE 2e — RE-ENROLLMENT TENANT ====================
-- Adds tenantId to all 5 re-enrollment models. ReEnrollmentPeriod is the
-- only true root; its 4 children (PriceTable, FamilyException, Response,
-- Invite) denormalize tenantId from the period for direct middleware
-- scoping (closes dashboard groupBy leak in re-enrollment-kanban).

-- ---------------------------------------------------------------------------
-- ReEnrollmentPeriod — root, backfill to seed tenant
-- ---------------------------------------------------------------------------
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "tenantId" TEXT;

UPDATE "ReEnrollmentPeriod"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "ReEnrollmentPeriod" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ReEnrollmentPeriod_tenantId_idx" ON "ReEnrollmentPeriod"("tenantId");
ALTER TABLE "ReEnrollmentPeriod"
  ADD CONSTRAINT "ReEnrollmentPeriod_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- PeriodPriceTable.tenantId — denormalized from ReEnrollmentPeriod
-- ---------------------------------------------------------------------------
ALTER TABLE "PeriodPriceTable" ADD COLUMN "tenantId" TEXT;

UPDATE "PeriodPriceTable" t
SET "tenantId" = p."tenantId"
FROM "ReEnrollmentPeriod" p
WHERE t."periodId" = p."id" AND t."tenantId" IS NULL;

ALTER TABLE "PeriodPriceTable" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "PeriodPriceTable_tenantId_idx" ON "PeriodPriceTable"("tenantId");
ALTER TABLE "PeriodPriceTable"
  ADD CONSTRAINT "PeriodPriceTable_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- FamilyPriceException.tenantId — denormalized from ReEnrollmentPeriod
-- ---------------------------------------------------------------------------
ALTER TABLE "FamilyPriceException" ADD COLUMN "tenantId" TEXT;

UPDATE "FamilyPriceException" e
SET "tenantId" = p."tenantId"
FROM "ReEnrollmentPeriod" p
WHERE e."periodId" = p."id" AND e."tenantId" IS NULL;

ALTER TABLE "FamilyPriceException" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "FamilyPriceException_tenantId_idx" ON "FamilyPriceException"("tenantId");
ALTER TABLE "FamilyPriceException"
  ADD CONSTRAINT "FamilyPriceException_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- PreReEnrollmentResponse.tenantId — denormalized from ReEnrollmentPeriod
-- ---------------------------------------------------------------------------
ALTER TABLE "PreReEnrollmentResponse" ADD COLUMN "tenantId" TEXT;

UPDATE "PreReEnrollmentResponse" r
SET "tenantId" = p."tenantId"
FROM "ReEnrollmentPeriod" p
WHERE r."periodId" = p."id" AND r."tenantId" IS NULL;

ALTER TABLE "PreReEnrollmentResponse" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "PreReEnrollmentResponse_tenantId_idx" ON "PreReEnrollmentResponse"("tenantId");
ALTER TABLE "PreReEnrollmentResponse"
  ADD CONSTRAINT "PreReEnrollmentResponse_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ReEnrollmentInvite.tenantId — denormalized from ReEnrollmentPeriod
-- ---------------------------------------------------------------------------
ALTER TABLE "ReEnrollmentInvite" ADD COLUMN "tenantId" TEXT;

UPDATE "ReEnrollmentInvite" i
SET "tenantId" = p."tenantId"
FROM "ReEnrollmentPeriod" p
WHERE i."periodId" = p."id" AND i."tenantId" IS NULL;

ALTER TABLE "ReEnrollmentInvite" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ReEnrollmentInvite_tenantId_idx" ON "ReEnrollmentInvite"("tenantId");
ALTER TABLE "ReEnrollmentInvite"
  ADD CONSTRAINT "ReEnrollmentInvite_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
