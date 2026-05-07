-- Add approval fields to FamilyPriceException
ALTER TABLE "FamilyPriceException" ADD COLUMN "previousDiscountPercent" DECIMAL(5,2);
ALTER TABLE "FamilyPriceException" ADD COLUMN "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "FamilyPriceException" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "FamilyPriceException" ADD COLUMN "approvalNotes" TEXT;
ALTER TABLE "FamilyPriceException" ADD COLUMN "approvalDecidedAt" TIMESTAMP(3);

-- Index for approval status queries
CREATE INDEX "FamilyPriceException_approvalStatus_idx" ON "FamilyPriceException"("approvalStatus");

-- Foreign key for approver
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
