-- Step 1: Update any existing rows that use FINANCIAL_RESPONSIBLE to PARENT
UPDATE "ContractSigner" SET "role" = 'PARENT' WHERE "role" = 'FINANCIAL_RESPONSIBLE';
UPDATE "AddendumSigner" SET "role" = 'PARENT' WHERE "role" = 'FINANCIAL_RESPONSIBLE';

-- Step 2: Remove FINANCIAL_RESPONSIBLE from ContractSignerRole enum
-- PostgreSQL does not support DROP VALUE from enum, so we recreate it
ALTER TYPE "ContractSignerRole" RENAME TO "ContractSignerRole_old";

CREATE TYPE "ContractSignerRole" AS ENUM ('PARENT', 'GUARDIAN', 'SCHOOL_REPRESENTATIVE', 'WITNESS');

ALTER TABLE "ContractSigner" ALTER COLUMN "role" TYPE "ContractSignerRole" USING ("role"::text::"ContractSignerRole");
ALTER TABLE "AddendumSigner" ALTER COLUMN "role" TYPE "ContractSignerRole" USING ("role"::text::"ContractSignerRole");

DROP TYPE "ContractSignerRole_old";

-- Step 3: Create ContractDefaultSigner table
CREATE TABLE "ContractDefaultSigner" (
    "id" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractDefaultSigner_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create unique index on (role, email)
CREATE UNIQUE INDEX "ContractDefaultSigner_role_email_key" ON "ContractDefaultSigner"("role", "email");
