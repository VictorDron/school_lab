-- Add DOCS_APROVADOS gate status for secretary approval step
ALTER TYPE "ReEnrollmentGateStatus" ADD VALUE IF NOT EXISTS 'DOCS_APROVADOS' AFTER 'FORMULARIO_CONFIRMADO';
