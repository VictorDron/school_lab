-- AlterTable
ALTER TABLE "ExperienceEvaluation" ADD COLUMN "lastEditedById" TEXT,
ADD COLUMN "lastEditedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
