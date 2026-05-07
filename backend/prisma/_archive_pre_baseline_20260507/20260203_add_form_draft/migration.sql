-- CreateEnum
CREATE TYPE "FormDraftType" AS ENUM ('ADMISSION', 'ENROLLMENT');

-- CreateTable
CREATE TABLE "FormDraft" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "formType" "FormDraftType" NOT NULL,
    "data" JSONB NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormDraft_token_idx" ON "FormDraft"("token");

-- CreateIndex
CREATE INDEX "FormDraft_expiresAt_idx" ON "FormDraft"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FormDraft_token_formType_key" ON "FormDraft"("token", "formType");
