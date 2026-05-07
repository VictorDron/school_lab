-- Optimize unviewed leads query performance
-- Add composite index for faster lookups

-- Index on LeadView for faster user-based lookups
CREATE INDEX IF NOT EXISTS "LeadView_leadId_idx" ON "LeadView"("leadId");

-- Partial index on Lead for FORM_RECEIVED status (most queried)
CREATE INDEX IF NOT EXISTS "Lead_applicationStatus_formReceived_idx"
ON "Lead"("id")
WHERE "applicationStatus" = 'FORM_RECEIVED';
