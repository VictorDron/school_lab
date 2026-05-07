-- CreateEnum
CREATE TYPE "LeadOriginType" AS ENUM ('ADMIN_CREATED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'LINK_SENT', 'FORM_RECEIVED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'RECEIVED', 'REJECTED', 'WAIVED');

-- AlterTable: Add new fields to Lead
ALTER TABLE "Lead" ADD COLUMN "originType" "LeadOriginType" NOT NULL DEFAULT 'ADMIN_CREATED';
ALTER TABLE "Lead" ADD COLUMN "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Lead" ADD COLUMN "applicationSentAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "lastFormSubmittedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "formSubmissionCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add new fields to LeadDocument
ALTER TABLE "LeadDocument" ADD COLUMN "uploadedBy" TEXT;
ALTER TABLE "LeadDocument" ADD COLUMN "uploadedVia" TEXT;
ALTER TABLE "LeadDocument" ADD COLUMN "childId" TEXT;

-- CreateTable: LeadDocumentRequest
CREATE TABLE "LeadDocumentRequest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "childId" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "LeadDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LeadView
CREATE TABLE "LeadView" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadDocumentRequest_leadId_idx" ON "LeadDocumentRequest"("leadId");
CREATE UNIQUE INDEX "LeadDocumentRequest_leadId_documentType_childId_key" ON "LeadDocumentRequest"("leadId", "documentType", "childId");

-- CreateIndex
CREATE INDEX "LeadView_userId_idx" ON "LeadView"("userId");
CREATE UNIQUE INDEX "LeadView_leadId_userId_key" ON "LeadView"("leadId", "userId");

-- CreateIndex
CREATE INDEX "Lead_applicationStatus_idx" ON "Lead"("applicationStatus");
CREATE INDEX "LeadDocument_childId_idx" ON "LeadDocument"("childId");

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocumentRequest" ADD CONSTRAINT "LeadDocumentRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadDocumentRequest" ADD CONSTRAINT "LeadDocumentRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadView" ADD CONSTRAINT "LeadView_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadView" ADD CONSTRAINT "LeadView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Set applicationStatus based on existing data
UPDATE "Lead" SET
  "applicationStatus" = CASE
    WHEN "applicationDate" IS NOT NULL THEN 'FORM_RECEIVED'::"ApplicationStatus"
    WHEN "applicationToken" IS NOT NULL THEN 'LINK_SENT'::"ApplicationStatus"
    ELSE 'PENDING'::"ApplicationStatus"
  END,
  "lastFormSubmittedAt" = "applicationDate",
  "formSubmissionCount" = CASE WHEN "applicationDate" IS NOT NULL THEN 1 ELSE 0 END;
