-- Add expiry date to documents for re-enrollment validity checks
ALTER TABLE "LeadEnrollmentDocument" ADD COLUMN "expiryDate" TIMESTAMP(3);
