-- CreateTable
CREATE TABLE "KanbanColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "order" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanbanColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KanbanColumn_slug_key" ON "KanbanColumn"("slug");

-- CreateIndex
CREATE INDEX "KanbanColumn_order_idx" ON "KanbanColumn"("order");

-- Insert default columns (matching the old LeadStatus enum order)
-- Only NEW_LEAD is marked as isDefault (protected from deletion) - it's where new leads go by default
INSERT INTO "KanbanColumn" ("id", "name", "slug", "color", "order", "isFinal", "isDefault", "createdAt", "updatedAt") VALUES
('kc-new-lead', 'Novo Lead', 'NEW_LEAD', '#94A3B8', 0, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-contacted', 'Contatado', 'CONTACTED', '#3B82F6', 1, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-visit-scheduled', 'Visita Agendada', 'VISIT_SCHEDULED', '#8B5CF6', 2, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-form-received', 'Formulário Recebido', 'FORM_RECEIVED', '#06B6D4', 3, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-interview-scheduled', 'Entrevista Agendada', 'INTERVIEW_SCHEDULED', '#F59E0B', 4, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-documents-pending', 'Documentos Pendentes', 'DOCUMENTS_PENDING', '#EC4899', 5, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-under-analysis', 'Em Análise', 'UNDER_ANALYSIS', '#6366F1', 6, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-approved', 'Aprovado', 'APPROVED', '#10B981', 7, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-waitlist', 'Lista de Espera', 'WAITLIST', '#F97316', 8, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-enrolled', 'Matriculado', 'ENROLLED', '#22C55E', 9, false, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-rejected', 'Rejeitado', 'REJECTED', '#EF4444', 10, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('kc-lost', 'Perdido', 'LOST', '#6B7280', 11, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add columnId column to Lead (nullable first)
ALTER TABLE "Lead" ADD COLUMN "columnId" TEXT;

-- Migrate existing leads: map status to columnId using slug
UPDATE "Lead" SET "columnId" = (
    SELECT "id" FROM "KanbanColumn" WHERE "slug" = "Lead"."status"::TEXT
);

-- Set default for any nulls (new leads without status)
UPDATE "Lead" SET "columnId" = 'kc-new-lead' WHERE "columnId" IS NULL;

-- Make columnId NOT NULL
ALTER TABLE "Lead" ALTER COLUMN "columnId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex (old status index)
DROP INDEX IF EXISTS "Lead_status_idx";

-- CreateIndex for columnId
CREATE INDEX "Lead_columnId_idx" ON "Lead"("columnId");

-- Drop the old status column
ALTER TABLE "Lead" DROP COLUMN "status";

-- Drop the LeadStatus enum type
DROP TYPE IF EXISTS "LeadStatus";

-- Add new audit action enum values
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'KANBAN_COLUMN_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'KANBAN_COLUMN_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'KANBAN_COLUMN_DELETED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'KANBAN_COLUMN_REORDERED';
