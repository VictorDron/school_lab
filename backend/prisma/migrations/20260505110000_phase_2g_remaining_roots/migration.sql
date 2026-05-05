-- ==================== PHASE 2g — REMAINING ROOTS ====================
-- Final phase. Adds tenantId to 12 last roots: AuditLog, Notification,
-- Student, Document, Asset (+ Category + Location), Supplier,
-- PurchaseRequest, CalendarEvent, InventorySession, ImportHistory.
--
-- Backfill strategy:
--   - User-derived (Notification.userId, Document.uploadedById,
--     ImportHistory.userId, PurchaseRequest.createdById,
--     CalendarEvent.createdById, InventorySession.startedById,
--     AuditLog.actorId, Asset.createdById): backfill from the user's
--     tenantId; fall back to seed for orphans (e.g. SetNull actors).
--   - Lead-derived (Student.leadId): backfill from Lead.tenantId.
--   - Tenant-config (AssetCategory, AssetLocation, Supplier): backfill
--     to seed tenant.
--
-- Unique constraints widened:
--   - Asset.code, Student.code, PurchaseRequest.code,
--     InventorySession.code -> (tenantId, code)
--   - AssetCategory.name, AssetLocation.name -> (tenantId, name)

-- ---------------------------------------------------------------------------
-- AuditLog (actor user — fallback to seed when actor is null/missing)
-- ---------------------------------------------------------------------------
ALTER TABLE "AuditLog" ADD COLUMN "tenantId" TEXT;
UPDATE "AuditLog" a
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE a."actorId" = u."id" AND a."tenantId" IS NULL;
UPDATE "AuditLog"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Notification (denormalized via User)
-- ---------------------------------------------------------------------------
ALTER TABLE "Notification" ADD COLUMN "tenantId" TEXT;
UPDATE "Notification" n
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE n."userId" = u."id" AND n."tenantId" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId");
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Document (uploadedBy User)
-- ---------------------------------------------------------------------------
ALTER TABLE "Document" ADD COLUMN "tenantId" TEXT;
UPDATE "Document" d
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE d."uploadedById" = u."id" AND d."tenantId" IS NULL;
ALTER TABLE "Document" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");
ALTER TABLE "Document"
  ADD CONSTRAINT "Document_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ImportHistory (User-derived)
-- ---------------------------------------------------------------------------
ALTER TABLE "ImportHistory" ADD COLUMN "tenantId" TEXT;
UPDATE "ImportHistory" ih
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE ih."userId" = u."id" AND ih."tenantId" IS NULL;
ALTER TABLE "ImportHistory" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "ImportHistory_tenantId_idx" ON "ImportHistory"("tenantId");
ALTER TABLE "ImportHistory"
  ADD CONSTRAINT "ImportHistory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- PurchaseRequest (createdBy User) — code unique widens to (tenantId, code)
-- ---------------------------------------------------------------------------
ALTER TABLE "PurchaseRequest" ADD COLUMN "tenantId" TEXT;
UPDATE "PurchaseRequest" pr
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE pr."createdById" = u."id" AND pr."tenantId" IS NULL;
ALTER TABLE "PurchaseRequest" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "PurchaseRequest" DROP CONSTRAINT IF EXISTS "PurchaseRequest_code_key";
DROP INDEX IF EXISTS "PurchaseRequest_code_key";
CREATE UNIQUE INDEX "PurchaseRequest_tenantId_code_key" ON "PurchaseRequest"("tenantId", "code");
CREATE INDEX "PurchaseRequest_tenantId_idx" ON "PurchaseRequest"("tenantId");
ALTER TABLE "PurchaseRequest"
  ADD CONSTRAINT "PurchaseRequest_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Supplier (config root — backfill to seed)
-- ---------------------------------------------------------------------------
ALTER TABLE "Supplier" ADD COLUMN "tenantId" TEXT;
UPDATE "Supplier"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "Supplier" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId");
ALTER TABLE "Supplier"
  ADD CONSTRAINT "Supplier_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- AssetCategory (config root) — name unique widens to (tenantId, name)
-- ---------------------------------------------------------------------------
ALTER TABLE "AssetCategory" ADD COLUMN "tenantId" TEXT;
UPDATE "AssetCategory"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "AssetCategory" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AssetCategory" DROP CONSTRAINT IF EXISTS "AssetCategory_name_key";
DROP INDEX IF EXISTS "AssetCategory_name_key";
CREATE UNIQUE INDEX "AssetCategory_tenantId_name_key" ON "AssetCategory"("tenantId", "name");
CREATE INDEX "AssetCategory_tenantId_idx" ON "AssetCategory"("tenantId");
ALTER TABLE "AssetCategory"
  ADD CONSTRAINT "AssetCategory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- AssetLocation (config root) — name unique widens to (tenantId, name)
-- ---------------------------------------------------------------------------
ALTER TABLE "AssetLocation" ADD COLUMN "tenantId" TEXT;
UPDATE "AssetLocation"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "AssetLocation" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "AssetLocation" DROP CONSTRAINT IF EXISTS "AssetLocation_name_key";
DROP INDEX IF EXISTS "AssetLocation_name_key";
CREATE UNIQUE INDEX "AssetLocation_tenantId_name_key" ON "AssetLocation"("tenantId", "name");
CREATE INDEX "AssetLocation_tenantId_idx" ON "AssetLocation"("tenantId");
ALTER TABLE "AssetLocation"
  ADD CONSTRAINT "AssetLocation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Asset (createdBy User) — code unique widens to (tenantId, code)
-- ---------------------------------------------------------------------------
ALTER TABLE "Asset" ADD COLUMN "tenantId" TEXT;
UPDATE "Asset" a
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE a."createdById" = u."id" AND a."tenantId" IS NULL;
ALTER TABLE "Asset" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Asset" DROP CONSTRAINT IF EXISTS "Asset_code_key";
DROP INDEX IF EXISTS "Asset_code_key";
CREATE UNIQUE INDEX "Asset_tenantId_code_key" ON "Asset"("tenantId", "code");
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId");
ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- InventorySession (startedBy User) — code unique widens
-- ---------------------------------------------------------------------------
ALTER TABLE "InventorySession" ADD COLUMN "tenantId" TEXT;
UPDATE "InventorySession" iv
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE iv."startedById" = u."id" AND iv."tenantId" IS NULL;
ALTER TABLE "InventorySession" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "InventorySession" DROP CONSTRAINT IF EXISTS "InventorySession_code_key";
DROP INDEX IF EXISTS "InventorySession_code_key";
CREATE UNIQUE INDEX "InventorySession_tenantId_code_key" ON "InventorySession"("tenantId", "code");
CREATE INDEX "InventorySession_tenantId_idx" ON "InventorySession"("tenantId");
ALTER TABLE "InventorySession"
  ADD CONSTRAINT "InventorySession_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- CalendarEvent (createdBy User)
-- ---------------------------------------------------------------------------
ALTER TABLE "CalendarEvent" ADD COLUMN "tenantId" TEXT;
UPDATE "CalendarEvent" ce
  SET "tenantId" = u."tenantId"
  FROM "User" u
  WHERE ce."createdById" = u."id" AND ce."tenantId" IS NULL;
ALTER TABLE "CalendarEvent" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "CalendarEvent_tenantId_idx" ON "CalendarEvent"("tenantId");
ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Student (Lead-derived) — code unique widens
-- ---------------------------------------------------------------------------
ALTER TABLE "Student" ADD COLUMN "tenantId" TEXT;
UPDATE "Student" s
  SET "tenantId" = l."tenantId"
  FROM "Lead" l
  WHERE s."leadId" = l."id" AND s."tenantId" IS NULL;
ALTER TABLE "Student" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_code_key";
DROP INDEX IF EXISTS "Student_code_key";
CREATE UNIQUE INDEX "Student_tenantId_code_key" ON "Student"("tenantId", "code");
CREATE INDEX "Student_tenantId_idx" ON "Student"("tenantId");
ALTER TABLE "Student"
  ADD CONSTRAINT "Student_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
