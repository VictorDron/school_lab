-- Add re-enrollment audit action values to AuditAction enum
-- Migration: 20260402000000_add_reenrollment_audit_actions (manual)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RE_ENROLLMENT_INVITE_SENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'RE_ENROLLMENT_INVITE_SENT';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RE_ENROLLMENT_FORM_SUBMITTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'RE_ENROLLMENT_FORM_SUBMITTED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RE_ENROLLMENT_DATA_UPDATED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AuditAction')) THEN
    ALTER TYPE "AuditAction" ADD VALUE 'RE_ENROLLMENT_DATA_UPDATED';
  END IF;
END $$;
