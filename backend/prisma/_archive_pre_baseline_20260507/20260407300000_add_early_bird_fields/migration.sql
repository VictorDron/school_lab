-- Add early bird deadline and discount fields to ReEnrollmentPeriod
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "earlyBirdDeadline" TIMESTAMP(3);
ALTER TABLE "ReEnrollmentPeriod" ADD COLUMN "earlyBirdDiscountPercent" DECIMAL(5,2);
