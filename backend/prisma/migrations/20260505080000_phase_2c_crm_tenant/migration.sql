-- ==================== PHASE 2c — CRM TENANT ====================
-- Adds tenantId to KanbanColumn (root config), CrmEvent (denormalized
-- from Lead), and ExperienceEvaluation (denormalized from Lead).
--
-- KanbanColumn.slug becomes per-tenant unique so each tenant configures
-- its own pipeline; the seed kanban set is attached to the seed tenant.

-- ---------------------------------------------------------------------------
-- KanbanColumn — config root, backfill to seed tenant. Drop the global
-- `slug` unique and recreate as `(tenantId, slug)`.
-- ---------------------------------------------------------------------------
ALTER TABLE "KanbanColumn" ADD COLUMN "tenantId" TEXT;

UPDATE "KanbanColumn"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "KanbanColumn" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "KanbanColumn" DROP CONSTRAINT IF EXISTS "KanbanColumn_slug_key";
DROP INDEX IF EXISTS "KanbanColumn_slug_key";
CREATE UNIQUE INDEX "KanbanColumn_tenantId_slug_key" ON "KanbanColumn"("tenantId", "slug");

CREATE INDEX "KanbanColumn_tenantId_idx" ON "KanbanColumn"("tenantId");
ALTER TABLE "KanbanColumn"
  ADD CONSTRAINT "KanbanColumn_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CrmEvent.tenantId — denormalized from Lead.tenantId.
-- ---------------------------------------------------------------------------
ALTER TABLE "CrmEvent" ADD COLUMN "tenantId" TEXT;

UPDATE "CrmEvent" e
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE e."leadId" = l."id" AND e."tenantId" IS NULL;

ALTER TABLE "CrmEvent" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "CrmEvent_tenantId_idx" ON "CrmEvent"("tenantId");
ALTER TABLE "CrmEvent"
  ADD CONSTRAINT "CrmEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ExperienceEvaluation.tenantId — denormalized from Lead.tenantId.
-- ---------------------------------------------------------------------------
ALTER TABLE "ExperienceEvaluation" ADD COLUMN "tenantId" TEXT;

UPDATE "ExperienceEvaluation" ev
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE ev."leadId" = l."id" AND ev."tenantId" IS NULL;

ALTER TABLE "ExperienceEvaluation" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ExperienceEvaluation_tenantId_idx" ON "ExperienceEvaluation"("tenantId");
ALTER TABLE "ExperienceEvaluation"
  ADD CONSTRAINT "ExperienceEvaluation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
