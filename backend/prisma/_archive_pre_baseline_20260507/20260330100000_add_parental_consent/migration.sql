-- Add PARENTAL_CONSENT_RECORDED to AuditAction enum (LGPD / SEC-05)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PARENTAL_CONSENT_RECORDED';

-- Create ParentalConsent table (LGPD / Lei 15.211/2025 — SEC-05)
CREATE TABLE IF NOT EXISTS "ParentalConsent" (
    "id"                 TEXT NOT NULL,
    "leadId"             TEXT NOT NULL,
    "ipAddress"          TEXT,
    "userAgent"          TEXT,
    "consentTextVersion" TEXT NOT NULL,
    "consentedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentalConsent_pkey" PRIMARY KEY ("id")
);

-- Add foreign key to Lead
ALTER TABLE "ParentalConsent" ADD CONSTRAINT "ParentalConsent_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS "ParentalConsent_leadId_idx" ON "ParentalConsent"("leadId");
CREATE INDEX IF NOT EXISTS "ParentalConsent_consentedAt_idx" ON "ParentalConsent"("consentedAt");
