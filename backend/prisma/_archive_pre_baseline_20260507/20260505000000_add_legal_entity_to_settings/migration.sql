-- AlterTable
ALTER TABLE "SystemSettings"
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "cnpj" TEXT,
  ADD COLUMN "legalAddress" TEXT,
  ADD COLUMN "legalCity" TEXT;
