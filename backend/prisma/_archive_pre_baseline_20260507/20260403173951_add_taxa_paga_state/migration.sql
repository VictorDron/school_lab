-- AlterEnum: Add TAXA_PAGA to ReEnrollmentGateStatus
ALTER TYPE "ReEnrollmentGateStatus" ADD VALUE 'TAXA_PAGA';

-- AlterTable: Add requiresFeePayment to ReEnrollmentPeriod
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "requiresFeePayment" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add negotiated discount fields to Contract
ALTER TABLE "Contract" ADD COLUMN "negotiatedDiscountPercent" DECIMAL(5,2),
ADD COLUMN "negotiatedFinalValue" DECIMAL(12,2),
ADD COLUMN "negotiationJustification" TEXT,
ADD COLUMN "negotiationApprovedById" TEXT;

-- CreateTable: EnrollmentFeePayment
CREATE TABLE "EnrollmentFeePayment" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentFeePayment_inviteId_key" ON "EnrollmentFeePayment"("inviteId");
CREATE INDEX "EnrollmentFeePayment_inviteId_idx" ON "EnrollmentFeePayment"("inviteId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_negotiationApprovedById_fkey" FOREIGN KEY ("negotiationApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFeePayment" ADD CONSTRAINT "EnrollmentFeePayment_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "ReEnrollmentInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFeePayment" ADD CONSTRAINT "EnrollmentFeePayment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backward compatibility: Set existing v2.0 periods to not require fee payment
UPDATE "ReEnrollmentPeriod" SET "requiresFeePayment" = false WHERE "requiresFeePayment" = true;
