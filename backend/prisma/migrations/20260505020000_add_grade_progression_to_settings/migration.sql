-- AlterTable
ALTER TABLE "SystemSettings"
  ADD COLUMN "gradeProgression" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
