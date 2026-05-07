-- Phase 9: Modify unique indexes to support RENEWAL contracts and multi-year students

-- 1. Drop the existing partial unique index on Contract (leadId only, blocks RENEWAL)
DROP INDEX IF EXISTS "Contract_leadId_active_unique";

-- 2. Create new composite partial unique index: one non-CANCELLED contract per (leadId, enrollmentType)
-- This allows one FIRST + one RENEWAL contract per lead simultaneously
CREATE UNIQUE INDEX "Contract_leadId_enrollmentType_active_unique"
ON "Contract" ("leadId", "enrollmentType")
WHERE "status" != 'CANCELLED';

-- 3. Drop the existing unique constraint on Student.leadChildId
-- (allows same child to have Student records in multiple academic years)
ALTER TABLE "Student" DROP CONSTRAINT IF EXISTS "Student_leadChildId_key";

-- 4. Create composite unique index: one Student per (leadChildId, academicYear)
CREATE UNIQUE INDEX "Student_leadChildId_academicYear_unique"
ON "Student" ("leadChildId", "academicYear");
