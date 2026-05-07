-- Manual migration: Add re-enrollment infrastructure (Phase 7)
-- Pattern: same as Phase 4 (Student tables), Phase 2 (contract index)
-- All statements are idempotent (safe to re-run)

-- ==================== 1. ENUMS (no dependencies) ====================

DO $$ BEGIN
  CREATE TYPE "ReEnrollmentPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReEnrollmentInviteStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'CONFIRMED', 'DECLINED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReEnrollmentGateStatus" AS ENUM ('CONVITE_ENVIADO', 'FORMULARIO_CONFIRMADO', 'CONTRATO_PENDENTE', 'CONTRATO_ASSINADO', 'REMATRICULADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "EnrollmentType" AS ENUM ('FIRST', 'RENEWAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==================== 2. ReEnrollmentPeriod TABLE (depends on User FK) ====================

CREATE TABLE IF NOT EXISTS "ReEnrollmentPeriod" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetYear" INTEGER NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "eligibleGrades" TEXT[],
  "status" "ReEnrollmentPeriodStatus" NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT NOT NULL,
  "openedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "finalizedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReEnrollmentPeriod_pkey" PRIMARY KEY ("id")
);

-- ==================== 3. Student.previousStudentId COLUMN ====================

ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "previousStudentId" TEXT;

-- ==================== 4. Contract.enrollmentType COLUMN ====================

ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'FIRST';

-- ==================== 5. ReEnrollmentInvite TABLE (depends on ReEnrollmentPeriod + Student) ====================

CREATE TABLE IF NOT EXISTS "ReEnrollmentInvite" (
  "id" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" "ReEnrollmentInviteStatus" NOT NULL DEFAULT 'PENDING',
  "gateStatus" "ReEnrollmentGateStatus" NOT NULL DEFAULT 'CONVITE_ENVIADO',
  "sentAt" TIMESTAMP(3),
  "openedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "declinedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "declineReason" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReEnrollmentInvite_pkey" PRIMARY KEY ("id")
);

-- ==================== 6. UNIQUE CONSTRAINTS AND INDEXES ====================

-- ReEnrollmentInvite unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "ReEnrollmentInvite_token_key" ON "ReEnrollmentInvite"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "ReEnrollmentInvite_periodId_studentId_key" ON "ReEnrollmentInvite"("periodId", "studentId");

-- ReEnrollmentPeriod indexes
CREATE INDEX IF NOT EXISTS "ReEnrollmentPeriod_status_idx" ON "ReEnrollmentPeriod"("status");
CREATE INDEX IF NOT EXISTS "ReEnrollmentPeriod_targetYear_idx" ON "ReEnrollmentPeriod"("targetYear");

-- ReEnrollmentInvite indexes
CREATE INDEX IF NOT EXISTS "ReEnrollmentInvite_token_idx" ON "ReEnrollmentInvite"("token");
CREATE INDEX IF NOT EXISTS "ReEnrollmentInvite_periodId_idx" ON "ReEnrollmentInvite"("periodId");
CREATE INDEX IF NOT EXISTS "ReEnrollmentInvite_studentId_idx" ON "ReEnrollmentInvite"("studentId");
CREATE INDEX IF NOT EXISTS "ReEnrollmentInvite_status_idx" ON "ReEnrollmentInvite"("status");
CREATE INDEX IF NOT EXISTS "ReEnrollmentInvite_gateStatus_idx" ON "ReEnrollmentInvite"("gateStatus");

-- Student.previousStudentId index
CREATE INDEX IF NOT EXISTS "Student_previousStudentId_idx" ON "Student"("previousStudentId");

-- ==================== 7. PARTIAL UNIQUE INDEX (single OPEN period constraint) ====================
-- Same pattern as Contract_leadId_active_unique from BUG-01.
-- Ensures only one ReEnrollmentPeriod can have status = 'OPEN' at any time.

CREATE UNIQUE INDEX IF NOT EXISTS "ReEnrollmentPeriod_status_open_unique"
ON "ReEnrollmentPeriod"("status")
WHERE "status" = 'OPEN';

-- ==================== 8. FOREIGN KEYS ====================

-- ReEnrollmentPeriod.createdById -> User(id) ON DELETE RESTRICT
DO $$ BEGIN
  ALTER TABLE "ReEnrollmentPeriod" ADD CONSTRAINT "ReEnrollmentPeriod_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ReEnrollmentInvite.periodId -> ReEnrollmentPeriod(id) ON DELETE CASCADE
DO $$ BEGIN
  ALTER TABLE "ReEnrollmentInvite" ADD CONSTRAINT "ReEnrollmentInvite_periodId_fkey"
  FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ReEnrollmentInvite.studentId -> Student(id) ON DELETE CASCADE
DO $$ BEGIN
  ALTER TABLE "ReEnrollmentInvite" ADD CONSTRAINT "ReEnrollmentInvite_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Student.previousStudentId -> Student(id) ON DELETE SET NULL (self-relation)
DO $$ BEGIN
  ALTER TABLE "Student" ADD CONSTRAINT "Student_previousStudentId_fkey"
  FOREIGN KEY ("previousStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
