-- ==================== PHASE 2f — COMMUNICATION TENANT ====================
-- Adds tenantId to 6 communication roots: Channel (true root, backfill
-- to seed), ModuleChannel + Message (denormalized from Channel),
-- Ticket + TaskBoard (true roots that may link to Channel; backfill to
-- seed since they aren't required to have a Channel), TaskCard
-- (denormalized via TaskColumn → TaskBoard).
--
-- Children (ChannelMember, MessageRead/Reaction/Mention, TicketComment/
-- Activity, TaskBoardMember, TaskColumn, TaskAssignment, TaskLabel,
-- TaskCardLabel) stay un-tenant-scoped — they're queried by parent FK
-- (channelId/ticketId/boardId/cardId) so naturally scoped, and Phase 5
-- RLS will close any residual gap at the DB level.
--
-- Unique constraints widened:
--   - Ticket.code -> (tenantId, code)
--   - TaskCard.code -> (tenantId, code)
--   - ModuleChannel(module, entityType, entityId) -> (tenantId, ...)

-- ---------------------------------------------------------------------------
-- Channel — true root, backfill to seed tenant
-- ---------------------------------------------------------------------------
ALTER TABLE "Channel" ADD COLUMN "tenantId" TEXT;
UPDATE "Channel"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "Channel" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Channel_tenantId_idx" ON "Channel"("tenantId");
ALTER TABLE "Channel"
  ADD CONSTRAINT "Channel_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- ModuleChannel — denormalized from Channel; widen unique to include tenantId
-- ---------------------------------------------------------------------------
ALTER TABLE "ModuleChannel" ADD COLUMN "tenantId" TEXT;
UPDATE "ModuleChannel" m
  SET "tenantId" = c."tenantId"
  FROM "Channel" c
  WHERE m."channelId" = c."id" AND m."tenantId" IS NULL;
ALTER TABLE "ModuleChannel" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ModuleChannel" DROP CONSTRAINT IF EXISTS "ModuleChannel_module_entityType_entityId_key";
DROP INDEX IF EXISTS "ModuleChannel_module_entityType_entityId_key";
CREATE UNIQUE INDEX "ModuleChannel_tenantId_module_entityType_entityId_key"
  ON "ModuleChannel"("tenantId", "module", "entityType", "entityId");
CREATE INDEX "ModuleChannel_tenantId_idx" ON "ModuleChannel"("tenantId");
ALTER TABLE "ModuleChannel"
  ADD CONSTRAINT "ModuleChannel_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Message — denormalized from Channel
-- ---------------------------------------------------------------------------
ALTER TABLE "Message" ADD COLUMN "tenantId" TEXT;
UPDATE "Message" msg
  SET "tenantId" = c."tenantId"
  FROM "Channel" c
  WHERE msg."channelId" = c."id" AND msg."tenantId" IS NULL;
ALTER TABLE "Message" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId");
ALTER TABLE "Message"
  ADD CONSTRAINT "Message_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Ticket — true root (Channel link is optional). Backfill to seed; widen
-- code unique to (tenantId, code).
-- ---------------------------------------------------------------------------
ALTER TABLE "Ticket" ADD COLUMN "tenantId" TEXT;
UPDATE "Ticket"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "Ticket" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_code_key";
DROP INDEX IF EXISTS "Ticket_code_key";
CREATE UNIQUE INDEX "Ticket_tenantId_code_key" ON "Ticket"("tenantId", "code");
CREATE INDEX "Ticket_tenantId_idx" ON "Ticket"("tenantId");
ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- TaskBoard — true root (Channel link is optional). Backfill to seed.
-- ---------------------------------------------------------------------------
ALTER TABLE "TaskBoard" ADD COLUMN "tenantId" TEXT;
UPDATE "TaskBoard"
  SET "tenantId" = '00000000-0000-0000-0000-000000000001'
  WHERE "tenantId" IS NULL;
ALTER TABLE "TaskBoard" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "TaskBoard_tenantId_idx" ON "TaskBoard"("tenantId");
ALTER TABLE "TaskBoard"
  ADD CONSTRAINT "TaskBoard_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- TaskCard — denormalized via TaskColumn → TaskBoard. Widen code unique.
-- ---------------------------------------------------------------------------
ALTER TABLE "TaskCard" ADD COLUMN "tenantId" TEXT;
UPDATE "TaskCard" card
  SET "tenantId" = b."tenantId"
  FROM "TaskColumn" col
  INNER JOIN "TaskBoard" b ON b."id" = col."boardId"
  WHERE card."columnId" = col."id" AND card."tenantId" IS NULL;
ALTER TABLE "TaskCard" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "TaskCard" DROP CONSTRAINT IF EXISTS "TaskCard_code_key";
DROP INDEX IF EXISTS "TaskCard_code_key";
CREATE UNIQUE INDEX "TaskCard_tenantId_code_key" ON "TaskCard"("tenantId", "code");
CREATE INDEX "TaskCard_tenantId_idx" ON "TaskCard"("tenantId");
ALTER TABLE "TaskCard"
  ADD CONSTRAINT "TaskCard_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
