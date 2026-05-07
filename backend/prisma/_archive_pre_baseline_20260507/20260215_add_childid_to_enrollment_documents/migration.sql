-- AlterTable
ALTER TABLE "LeadEnrollmentDocument" ADD COLUMN "childId" TEXT;

-- CreateIndex
CREATE INDEX "LeadEnrollmentDocument_childId_idx" ON "LeadEnrollmentDocument"("childId");

-- AddForeignKey
ALTER TABLE "LeadEnrollmentDocument" ADD CONSTRAINT "LeadEnrollmentDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;
