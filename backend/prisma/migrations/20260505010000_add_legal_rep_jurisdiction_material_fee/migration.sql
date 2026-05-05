-- AlterTable
ALTER TABLE "SystemSettings"
  ADD COLUMN "legalRepresentative" TEXT,
  ADD COLUMN "jurisdiction" TEXT,
  ADD COLUMN "internationalMaterialFee" DECIMAL(12, 2);
