-- ==================== PHASE 2a — USER + INVITE TENANT ====================
-- Tighten User.tenantId to NOT NULL (it's been backfilled since Phase 0
-- and every code path now stamps it). Add tenantId to Invite, derived
-- from the inviter's tenantId for any pre-existing rows.

-- ---------------------------------------------------------------------------
-- User.tenantId — defensive backfill (no-op if Phase 0 migration already
-- ran and every row has a tenantId), then SET NOT NULL.
-- ---------------------------------------------------------------------------
UPDATE "User"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;

-- Replace the SetNull cascade with Cascade — tenantId is now mandatory,
-- so deleting a tenant must take its users with it (cascade is what the
-- updated schema declares).
ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";
ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Invite.tenantId — backfill from inviter, then NOT NULL + FK + index.
-- ---------------------------------------------------------------------------
ALTER TABLE "Invite" ADD COLUMN "tenantId" TEXT;

UPDATE "Invite" i
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE i."invitedBy" = u."id" AND i."tenantId" IS NULL;

-- Final fallback in the unlikely case an inviter row was already gone
-- (shouldn't happen — invitedBy is a NOT NULL FK — but defensive).
UPDATE "Invite"
SET "tenantId" = '00000000-0000-0000-0000-000000000001'
WHERE "tenantId" IS NULL;

ALTER TABLE "Invite" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Invite_tenantId_idx" ON "Invite"("tenantId");
ALTER TABLE "Invite"
  ADD CONSTRAINT "Invite_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
