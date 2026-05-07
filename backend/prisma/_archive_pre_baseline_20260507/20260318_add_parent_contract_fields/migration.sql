-- Add nationality and maritalStatus fields to LeadParent for contract generation
ALTER TABLE "LeadParent" ADD COLUMN IF NOT EXISTS "nationality" TEXT;
ALTER TABLE "LeadParent" ADD COLUMN IF NOT EXISTS "maritalStatus" TEXT;
