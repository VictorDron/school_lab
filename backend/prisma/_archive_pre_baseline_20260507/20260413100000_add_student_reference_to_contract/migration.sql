-- Add student reference and grade snapshot to Contract for re-enrollment traceability

-- 1. Add studentId FK (optional, used for RENEWAL contracts)
ALTER TABLE "Contract" ADD COLUMN "studentId" TEXT;
ALTER TABLE "Contract" ADD COLUMN "studentGrade" TEXT;

-- 2. Add FK constraint
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Add index for student lookups
CREATE INDEX "Contract_studentId_idx" ON "Contract"("studentId");
