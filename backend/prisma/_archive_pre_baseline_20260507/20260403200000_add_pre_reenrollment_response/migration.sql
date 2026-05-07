-- CreateEnum
CREATE TYPE "PreReEnrollmentResponseStatus" AS ENUM ('PENDING', 'AGREED', 'DISAGREED', 'NEGOTIATING', 'NEGOTIATED');

-- AlterTable: Add pre-re-enrollment fields to ReEnrollmentPeriod
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "preReEnrollmentEmailTemplate" TEXT;
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "preReEnrollmentDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PreReEnrollmentResponse" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "PreReEnrollmentResponseStatus" NOT NULL DEFAULT 'PENDING',
    "emailSentAt" TIMESTAMP(3),
    "emailTo" TEXT,
    "respondedAt" TIMESTAMP(3),
    "disagreementReason" TEXT,
    "negotiatedDiscountPercent" DECIMAL(5,2),
    "negotiatedFinalValue" DECIMAL(12,2),
    "negotiationJustification" TEXT,
    "negotiationApprovedById" TEXT,
    "negotiationCompletedAt" TIMESTAMP(3),
    "communicatedAnnualValue" DECIMAL(12,2),
    "communicatedAdjustmentPercent" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreReEnrollmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreReEnrollmentResponse_token_key" ON "PreReEnrollmentResponse"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PreReEnrollmentResponse_periodId_studentId_key" ON "PreReEnrollmentResponse"("periodId", "studentId");

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_periodId_idx" ON "PreReEnrollmentResponse"("periodId");

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_studentId_idx" ON "PreReEnrollmentResponse"("studentId");

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_token_idx" ON "PreReEnrollmentResponse"("token");

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_status_idx" ON "PreReEnrollmentResponse"("status");

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_negotiationApprovedById_fkey" FOREIGN KEY ("negotiationApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
