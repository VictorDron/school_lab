-- AlterTable: Add CRM integration fields to TaskCard
ALTER TABLE "TaskCard" ADD COLUMN "sourceModule" TEXT;
ALTER TABLE "TaskCard" ADD COLUMN "sourceLeadId" TEXT;
ALTER TABLE "TaskCard" ADD COLUMN "sourceType" TEXT;

-- AlterTable: Add taskCardId to AdmissionGateApproval
ALTER TABLE "AdmissionGateApproval" ADD COLUMN "taskCardId" TEXT;

-- CreateIndex
CREATE INDEX "TaskCard_sourceModule_idx" ON "TaskCard"("sourceModule");
CREATE INDEX "TaskCard_sourceLeadId_idx" ON "TaskCard"("sourceLeadId");

-- CreateIndex (unique)
CREATE UNIQUE INDEX "AdmissionGateApproval_taskCardId_key" ON "AdmissionGateApproval"("taskCardId");

-- AddForeignKey
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_taskCardId_fkey" FOREIGN KEY ("taskCardId") REFERENCES "TaskCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
