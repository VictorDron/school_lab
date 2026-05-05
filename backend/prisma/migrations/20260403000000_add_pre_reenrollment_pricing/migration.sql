-- Add adjustmentPercent to ReEnrollmentPeriod
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "adjustmentPercent" DECIMAL(5,2);

-- Period Price Table: base values per grade per period
CREATE TABLE "PeriodPriceTable" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "periodId" TEXT NOT NULL,
  "grade" TEXT NOT NULL,
  "baseAnnualValue" DECIMAL(12,2) NOT NULL,
  "enrollmentFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "discountPercent" DECIMAL(5,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeriodPriceTable_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PeriodPriceTable_periodId_grade_key" UNIQUE ("periodId", "grade"),
  CONSTRAINT "PeriodPriceTable_periodId_fkey" FOREIGN KEY ("periodId")
    REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE
);
CREATE INDEX "PeriodPriceTable_periodId_idx" ON "PeriodPriceTable"("periodId");

-- Family Price Exception: per-family overrides
CREATE TABLE "FamilyPriceException" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "periodId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "overrideAnnualValue" DECIMAL(12,2),
  "overrideDiscountPercent" DECIMAL(5,2),
  "justification" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyPriceException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "FamilyPriceException_periodId_studentId_key" UNIQUE ("periodId", "studentId"),
  CONSTRAINT "FamilyPriceException_periodId_fkey" FOREIGN KEY ("periodId")
    REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE,
  CONSTRAINT "FamilyPriceException_studentId_fkey" FOREIGN KEY ("studentId")
    REFERENCES "Student"("id") ON DELETE CASCADE,
  CONSTRAINT "FamilyPriceException_createdById_fkey" FOREIGN KEY ("createdById")
    REFERENCES "User"("id") ON DELETE RESTRICT
);
CREATE INDEX "FamilyPriceException_periodId_idx" ON "FamilyPriceException"("periodId");
CREATE INDEX "FamilyPriceException_studentId_idx" ON "FamilyPriceException"("studentId");
