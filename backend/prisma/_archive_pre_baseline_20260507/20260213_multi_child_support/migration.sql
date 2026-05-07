-- DropIndex
DROP INDEX IF EXISTS "LeadAdditionalInfo_leadId_key";
DROP INDEX IF EXISTS "LeadEnrollmentInfo_leadId_key";

-- AlterTable: LeadAdditionalInfo
-- Remove @unique from leadId, add childId relation, add composite unique
ALTER TABLE "LeadAdditionalInfo" ADD COLUMN IF NOT EXISTS "childId" TEXT;
ALTER TABLE "LeadAdditionalInfo" ADD CONSTRAINT "LeadAdditionalInfo_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "LeadAdditionalInfo_leadId_childId_key" ON "LeadAdditionalInfo"("leadId", "childId");
CREATE INDEX IF NOT EXISTS "LeadAdditionalInfo_childId_idx" ON "LeadAdditionalInfo"("childId");

-- AlterTable: LeadEnrollmentInfo
-- Remove @unique from leadId, add childId relation, add composite unique
ALTER TABLE "LeadEnrollmentInfo" ADD COLUMN IF NOT EXISTS "childId" TEXT;
ALTER TABLE "LeadEnrollmentInfo" ADD CONSTRAINT "LeadEnrollmentInfo_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "LeadEnrollmentInfo_childId_key" ON "LeadEnrollmentInfo"("childId");
CREATE UNIQUE INDEX IF NOT EXISTS "LeadEnrollmentInfo_leadId_childId_key" ON "LeadEnrollmentInfo"("leadId", "childId");
CREATE INDEX IF NOT EXISTS "LeadEnrollmentInfo_leadId_idx" ON "LeadEnrollmentInfo"("leadId");
