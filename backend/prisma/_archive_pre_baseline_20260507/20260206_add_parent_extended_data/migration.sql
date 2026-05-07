-- AlterTable
-- Add document information fields to LeadParent
ALTER TABLE "LeadParent"
ADD COLUMN "idNumber" TEXT,
ADD COLUMN "idIssueDate" TEXT,
ADD COLUMN "idIssuer" TEXT,
ADD COLUMN "dateOfBirth" TIMESTAMP(3),
ADD COLUMN "education" TEXT,
ADD COLUMN "religion" TEXT,
ADD COLUMN "zipCode" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "neighborhood" TEXT,
ADD COLUMN "street" TEXT,
ADD COLUMN "number" TEXT,
ADD COLUMN "complement" TEXT;
