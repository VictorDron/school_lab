-- Prevent duplicate enrollment documents per child per type
-- First clean up any existing duplicates (keep the most recent)
DELETE FROM "LeadEnrollmentDocument" a
USING "LeadEnrollmentDocument" b
WHERE a."id" < b."id"
  AND a."leadId" = b."leadId"
  AND a."documentType" = b."documentType"
  AND (a."childId" = b."childId" OR (a."childId" IS NULL AND b."childId" IS NULL));

CREATE UNIQUE INDEX "LeadEnrollmentDocument_leadId_childId_documentType_key"
ON "LeadEnrollmentDocument" ("leadId", COALESCE("childId", ''), "documentType");

-- Prevent duplicate payment installments per contract
DELETE FROM "ContractPayment" a
USING "ContractPayment" b
WHERE a."id" < b."id"
  AND a."contractId" = b."contractId"
  AND a."installmentNumber" = b."installmentNumber";

ALTER TABLE "ContractPayment"
ADD CONSTRAINT "ContractPayment_contractId_installmentNumber_key"
UNIQUE ("contractId", "installmentNumber");
