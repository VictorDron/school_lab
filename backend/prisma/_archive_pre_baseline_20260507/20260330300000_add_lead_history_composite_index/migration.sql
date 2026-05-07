-- AddIndex: composite index on LeadHistory(leadId, createdAt) for timeline queries
CREATE INDEX IF NOT EXISTS "LeadHistory_leadId_createdAt_idx" ON "LeadHistory"("leadId", "createdAt");
