-- AlterEnum: Add new values to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PSYCHOLOGY';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HEALTH';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LEGAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DIRECTOR';

-- AlterEnum: Add new values to AdmissionGateStatus
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'FORM_RECEIVED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'FORM_APPROVED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'INTERVIEW_COMPLETED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'DOCS_REQUESTED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'DOCS_RECEIVED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'ENROLLMENT_PENDING';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'ENROLLMENT_COMPLETED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'CONTRACT_PENDING';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'CONTRACT_SIGNED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'FINANCIAL_APPROVED';
ALTER TYPE "AdmissionGateStatus" ADD VALUE IF NOT EXISTS 'ENROLLED';

-- CreateEnum: AdmissionDepartment
DO $$ BEGIN
  CREATE TYPE "AdmissionDepartment" AS ENUM ('ADMISSIONS', 'PSYCHOLOGY', 'HEALTH', 'SECRETARIAT', 'COORDINATION', 'FINANCE', 'LEGAL', 'DIRECTOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: GateApprovalDecision
DO $$ BEGIN
  CREATE TYPE "GateApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL', 'ESCALATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: ContractStatus
DO $$ BEGIN
  CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_LEGAL', 'PENDING_FINANCIAL', 'SENT', 'SIGNED', 'ACTIVE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: ContractSignerRole
DO $$ BEGIN
  CREATE TYPE "ContractSignerRole" AS ENUM ('PARENT', 'GUARDIAN', 'FINANCIAL_RESPONSIBLE', 'SCHOOL_REPRESENTATIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: ClickSignEnvelopeStatus
DO $$ BEGIN
  CREATE TYPE "ClickSignEnvelopeStatus" AS ENUM ('CREATED', 'RUNNING', 'COMPLETED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: PaymentStatus
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: FinancialAnalysisStatus
DO $$ BEGIN
  CREATE TYPE "FinancialAnalysisStatus" AS ENUM ('PENDING', 'IN_ANALYSIS', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: EscalationSeverity
DO $$ BEGIN
  CREATE TYPE "EscalationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: AdmissionGateApproval
CREATE TABLE "AdmissionGateApproval" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "decision" "GateApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "notes" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionGateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GateStepConfig
CREATE TABLE "GateStepConfig" (
    "id" TEXT NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "approvalOrder" INTEGER NOT NULL DEFAULT 0,
    "allowedRoles" "UserRole"[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GateStepConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CriticalIssueEscalation
CREATE TABLE "CriticalIssueEscalation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "raisedById" TEXT NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "EscalationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriticalIssueEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Contract
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "templateVersion" TEXT,
    "totalAnnualValue" DECIMAL(12,2),
    "installments" INTEGER,
    "discountPercent" DECIMAL(5,2),
    "enrollmentFee" DECIMAL(12,2),
    "documentUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "clicksignEnvelopeId" TEXT,
    "clicksignStatus" "ClickSignEnvelopeStatus",
    "clicksignEnvelopeUrl" TEXT,
    "legalApprovalStatus" "GateApprovalDecision",
    "legalApprovedById" TEXT,
    "legalApprovedAt" TIMESTAMP(3),
    "legalNotes" TEXT,
    "financialApprovalStatus" "GateApprovalDecision",
    "financialApprovedById" TEXT,
    "financialApprovedAt" TIMESTAMP(3),
    "financialNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ContractSigner
CREATE TABLE "ContractSigner" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "clicksignSignerId" TEXT,
    "clicksignAuthMethod" TEXT,
    "hasSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "refusedAt" TIMESTAMP(3),
    "refusalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ContractPayment
CREATE TABLE "ContractPayment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "boletoUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: FinancialAnalysis
CREATE TABLE "FinancialAnalysis" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "cpfAnalyzed" TEXT,
    "cpfStatus" TEXT,
    "analysisNotes" TEXT,
    "negotiationNotes" TEXT,
    "status" "FinancialAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ClickSignWebhookLog
CREATE TABLE "ClickSignWebhookLog" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickSignWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionGateApproval_leadId_idx" ON "AdmissionGateApproval"("leadId");
CREATE INDEX "AdmissionGateApproval_gateStep_idx" ON "AdmissionGateApproval"("gateStep");
CREATE INDEX "AdmissionGateApproval_department_idx" ON "AdmissionGateApproval"("department");
CREATE INDEX "AdmissionGateApproval_decision_idx" ON "AdmissionGateApproval"("decision");
CREATE UNIQUE INDEX "AdmissionGateApproval_leadId_gateStep_department_key" ON "AdmissionGateApproval"("leadId", "gateStep", "department");

CREATE INDEX "GateStepConfig_gateStep_idx" ON "GateStepConfig"("gateStep");
CREATE UNIQUE INDEX "GateStepConfig_gateStep_department_key" ON "GateStepConfig"("gateStep", "department");

CREATE INDEX "CriticalIssueEscalation_leadId_idx" ON "CriticalIssueEscalation"("leadId");
CREATE INDEX "CriticalIssueEscalation_isResolved_idx" ON "CriticalIssueEscalation"("isResolved");
CREATE INDEX "CriticalIssueEscalation_severity_idx" ON "CriticalIssueEscalation"("severity");

CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");
CREATE UNIQUE INDEX "Contract_clicksignEnvelopeId_key" ON "Contract"("clicksignEnvelopeId");
CREATE INDEX "Contract_leadId_idx" ON "Contract"("leadId");
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

CREATE INDEX "ContractSigner_contractId_idx" ON "ContractSigner"("contractId");

CREATE INDEX "ContractPayment_contractId_idx" ON "ContractPayment"("contractId");
CREATE INDEX "ContractPayment_status_idx" ON "ContractPayment"("status");

CREATE UNIQUE INDEX "FinancialAnalysis_leadId_key" ON "FinancialAnalysis"("leadId");

CREATE INDEX "ClickSignWebhookLog_envelopeId_idx" ON "ClickSignWebhookLog"("envelopeId");
CREATE INDEX "ClickSignWebhookLog_processed_idx" ON "ClickSignWebhookLog"("processed");

-- AddForeignKey
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_legalApprovedById_fkey" FOREIGN KEY ("legalApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_financialApprovedById_fkey" FOREIGN KEY ("financialApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ContractSigner" ADD CONSTRAINT "ContractSigner_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContractPayment" ADD CONSTRAINT "ContractPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialAnalysis" ADD CONSTRAINT "FinancialAnalysis_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed GateStepConfig with default approval requirements
INSERT INTO "GateStepConfig" ("id", "gateStep", "department", "isRequired", "approvalOrder", "allowedRoles", "description", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'FORM_APPROVED', 'ADMISSIONS', true, 1, ARRAY['ADMISSIONS', 'ADMIN']::"UserRole"[], 'Aprovação do formulário de inscrição', NOW(), NOW()),
  (gen_random_uuid(), 'VISIT_APPROVED', 'ADMISSIONS', true, 1, ARRAY['ADMISSIONS', 'ADMIN']::"UserRole"[], 'Aprovação após visita/entrevista', NOW(), NOW()),
  (gen_random_uuid(), 'EVALUATION_COMPLETED', 'PSYCHOLOGY', true, 1, ARRAY['PSYCHOLOGY', 'ADMIN']::"UserRole"[], 'Avaliação psicológica da vivência', NOW(), NOW()),
  (gen_random_uuid(), 'EVALUATION_COMPLETED', 'HEALTH', true, 2, ARRAY['HEALTH', 'ADMIN']::"UserRole"[], 'Avaliação de saúde da vivência', NOW(), NOW()),
  (gen_random_uuid(), 'EVALUATION_COMPLETED', 'COORDINATION', true, 3, ARRAY['COORDINATOR', 'ADMIN']::"UserRole"[], 'Avaliação da coordenação pedagógica', NOW(), NOW()),
  (gen_random_uuid(), 'APPROVED', 'SECRETARIAT', true, 1, ARRAY['SECRETARY', 'ADMIN']::"UserRole"[], 'Aprovação final da secretaria', NOW(), NOW()),
  (gen_random_uuid(), 'CONTRACT_PENDING', 'LEGAL', true, 1, ARRAY['LEGAL', 'ADMIN']::"UserRole"[], 'Revisão jurídica do contrato', NOW(), NOW()),
  (gen_random_uuid(), 'CONTRACT_PENDING', 'FINANCE', true, 2, ARRAY['FINANCE', 'ADMIN']::"UserRole"[], 'Aprovação financeira do contrato', NOW(), NOW()),
  (gen_random_uuid(), 'FINANCIAL_APPROVED', 'FINANCE', true, 1, ARRAY['FINANCE', 'ADMIN']::"UserRole"[], 'Confirmação financeira final', NOW(), NOW()),
  (gen_random_uuid(), 'ENROLLED', 'ADMISSIONS', true, 1, ARRAY['ADMISSIONS', 'ADMIN']::"UserRole"[], 'Confirmação de matrícula', NOW(), NOW())
ON CONFLICT DO NOTHING;
