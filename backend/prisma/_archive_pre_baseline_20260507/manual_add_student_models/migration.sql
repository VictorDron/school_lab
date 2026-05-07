-- Manual migration: Add STUDENT_MANAGEMENT to AppModule enum and create Student tables
-- Pattern: same as Phase 1 (ParentalConsent), Phase 2 (contract index), Phase 3 (LeadHistory index)

-- Add new value to AppModule enum
ALTER TYPE "AppModule" ADD VALUE IF NOT EXISTS 'STUDENT_MANAGEMENT';

-- Add StudentStatus enum
DO $$ BEGIN
  CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Student table
CREATE TABLE IF NOT EXISTS "Student" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "leadChildId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3),
  "cpf" TEXT,
  "gender" TEXT,
  "nationality" TEXT,
  "grade" TEXT,
  "academicYear" INTEGER NOT NULL,
  "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
  "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- Create StudentHistory table
CREATE TABLE IF NOT EXISTS "StudentHistory" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "details" JSONB,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StudentHistory_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Student_code_key" ON "Student"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_leadChildId_key" ON "Student"("leadChildId");

-- Indexes
CREATE INDEX IF NOT EXISTS "Student_leadId_idx" ON "Student"("leadId");
CREATE INDEX IF NOT EXISTS "Student_grade_idx" ON "Student"("grade");
CREATE INDEX IF NOT EXISTS "Student_academicYear_idx" ON "Student"("academicYear");
CREATE INDEX IF NOT EXISTS "Student_status_idx" ON "Student"("status");
CREATE INDEX IF NOT EXISTS "StudentHistory_studentId_idx" ON "StudentHistory"("studentId");
CREATE INDEX IF NOT EXISTS "StudentHistory_studentId_createdAt_idx" ON "StudentHistory"("studentId", "createdAt");

-- Foreign keys
ALTER TABLE "Student" ADD CONSTRAINT "Student_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_leadChildId_fkey" FOREIGN KEY ("leadChildId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentHistory" ADD CONSTRAINT "StudentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
