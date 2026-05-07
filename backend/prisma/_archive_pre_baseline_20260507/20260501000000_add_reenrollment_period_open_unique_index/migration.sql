-- Re-create the partial unique index that enforces "only one
-- ReEnrollmentPeriod with status='OPEN' at any time".
--
-- The original migration (20260401000000_add_reenrollment_infrastructure)
-- declared this index, but in production it was applied as a baseline
-- (applied_steps_count = 0) so the SQL was never actually executed. As a
-- result two rows ended up with status='OPEN' simultaneously.
--
-- This migration is idempotent (`IF NOT EXISTS`), so it is a no-op for
-- environments where the index already exists.
--
-- Companion to the in-app guard `assertNoOtherOpenPeriod` in
-- backend/src/services/re-enrollment-core.service.ts.

CREATE UNIQUE INDEX IF NOT EXISTS "ReEnrollmentPeriod_status_open_unique"
ON "ReEnrollmentPeriod"("status")
WHERE "status" = 'OPEN';
