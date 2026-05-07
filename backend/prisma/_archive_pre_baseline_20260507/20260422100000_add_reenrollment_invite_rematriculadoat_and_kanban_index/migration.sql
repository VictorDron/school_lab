-- Add rematriculadoAt timestamp and composite index for Kanban performance

-- 1. rematriculadoAt: terminal-transition timestamp used for auto-archive after 30 days.
ALTER TABLE "ReEnrollmentInvite" ADD COLUMN "rematriculadoAt" TIMESTAMP(3);

-- 2. Backfill existing REMATRICULADO rows. REMATRICULADO is a terminal state
--    with no post-transition writers in current code paths, so updatedAt is
--    the closest available approximation of the actual transition timestamp.
UPDATE "ReEnrollmentInvite"
SET "rematriculadoAt" = "updatedAt"
WHERE "gateStatus" = 'REMATRICULADO' AND "rematriculadoAt" IS NULL;

-- 3. Composite index for grouped Kanban queries (target: 800+ invites per period).
CREATE INDEX "ReEnrollmentInvite_periodId_gateStatus_idx"
  ON "ReEnrollmentInvite"("periodId", "gateStatus");
