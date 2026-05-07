-- Phase 5: Import History model + enum values for bulk import
-- Manual migration: shadow DB divergence (consistent with Phases 1-4)

-- Add IMPORT to LeadSource enum
ALTER TYPE "LeadSource" ADD VALUE IF NOT EXISTS 'IMPORT';

-- Add BULK_IMPORT to AuditAction enum
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BULK_IMPORT';

-- Create ImportHistory table
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "totalRows" INTEGER NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- Foreign key
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "ImportHistory_userId_idx" ON "ImportHistory"("userId");
CREATE INDEX "ImportHistory_createdAt_idx" ON "ImportHistory"("createdAt");
