-- Marketing inbound leads (SaaS prospects from public landing pages).
-- Not tenant-scoped — these prospects exist before any tenant is created.

-- CreateEnum
CREATE TYPE "MarketingLeadIntent" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE', 'SOBMEDIDA', 'DEMO');

-- CreateEnum
CREATE TYPE "MarketingLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISCARDED');

-- CreateTable
CREATE TABLE "MarketingLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studentCount" TEXT NOT NULL,
    "notes" TEXT,
    "intent" "MarketingLeadIntent" NOT NULL,
    "status" "MarketingLeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingLead_email_idx" ON "MarketingLead"("email");

-- CreateIndex
CREATE INDEX "MarketingLead_intent_idx" ON "MarketingLead"("intent");

-- CreateIndex
CREATE INDEX "MarketingLead_status_idx" ON "MarketingLead"("status");

-- CreateIndex
CREATE INDEX "MarketingLead_createdAt_idx" ON "MarketingLead"("createdAt");
