-- ==================== PHASE 2d — CONTRACT TENANT ====================
-- Adds tenantId to Contract, ContractAddendum, ContractDefaultSigner,
-- and GateStepConfig. Backfills:
--   - Contract from its Lead.tenantId.
--   - ContractAddendum from its Contract.tenantId (set after Contract).
--   - ContractDefaultSigner + GateStepConfig from the seed tenant
--     (these are pure config tables that pre-date tenancy).
-- Then NOT NULL + FK + indexes for all four.

-- ---------------------------------------------------------------------------
-- Contract.tenantId (denormalized from Lead)
-- ---------------------------------------------------------------------------
ALTER TABLE "Contract" ADD COLUMN "tenantId" TEXT;

UPDATE "Contract" c
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE c."leadId" = l."id" AND c."tenantId" IS NULL;

ALTER TABLE "Contract" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId");
ALTER TABLE "Contract"
  ADD CONSTRAINT "Contract_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ContractAddendum.tenantId (denormalized from Contract)
-- ---------------------------------------------------------------------------
ALTER TABLE "ContractAddendum" ADD COLUMN "tenantId" TEXT;

UPDATE "ContractAddendum" a
SET "tenantId" = c."tenantId"
FROM "Contract" c
WHERE a."contractId" = c."id" AND a."tenantId" IS NULL;

ALTER TABLE "ContractAddendum" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ContractAddendum_tenantId_idx" ON "ContractAddendum"("tenantId");
ALTER TABLE "ContractAddendum"
  ADD CONSTRAINT "ContractAddendum_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ContractDefaultSigner.tenantId (config table — backfill to seed tenant)
-- ---------------------------------------------------------------------------
ALTER TABLE "ContractDefaultSigner" ADD COLUMN "tenantId" TEXT;

UPDATE "ContractDefaultSigner"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "ContractDefaultSigner" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ContractDefaultSigner_tenantId_idx" ON "ContractDefaultSigner"("tenantId");
ALTER TABLE "ContractDefaultSigner"
  ADD CONSTRAINT "ContractDefaultSigner_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- GateStepConfig.tenantId (config table — backfill to seed tenant)
-- The unique constraint widens from (gateStep, department) to
-- (tenantId, gateStep, department) so each tenant gets its own gate setup.
-- ---------------------------------------------------------------------------
ALTER TABLE "GateStepConfig" ADD COLUMN "tenantId" TEXT;

UPDATE "GateStepConfig"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "GateStepConfig" ALTER COLUMN "tenantId" SET NOT NULL;

-- Drop old unique, add new tenant-scoped one.
ALTER TABLE "GateStepConfig" DROP CONSTRAINT IF EXISTS "GateStepConfig_gateStep_department_key";
DROP INDEX IF EXISTS "GateStepConfig_gateStep_department_key";
CREATE UNIQUE INDEX "GateStepConfig_tenantId_gateStep_department_key"
  ON "GateStepConfig"("tenantId", "gateStep", "department");

CREATE INDEX "GateStepConfig_tenantId_idx" ON "GateStepConfig"("tenantId");
ALTER TABLE "GateStepConfig"
  ADD CONSTRAINT "GateStepConfig_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
