-- ==================== PHASE 2b — LEAD TENANT ====================
-- Add tenantId to Lead. The Lead-family children (LeadChild, LeadAddress,
-- LeadParent, LeadHistory, ApplicationTokenLog, ParentalConsent, etc.)
-- derive their tenant scope through Lead's FK — no per-child column.
--
-- Backfill all existing Leads to the seed tenant created by migration
-- 20260505040000_add_tenant_foundation.

ALTER TABLE "Lead" ADD COLUMN "tenantId" TEXT;

UPDATE "Lead"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "Lead" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
