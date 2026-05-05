-- CreateEnum
CREATE TYPE "NotificationPreference" AS ENUM ('PRIMARY', 'MOTHER', 'FATHER', 'BOTH');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "notificationPreference" "NotificationPreference" NOT NULL DEFAULT 'PRIMARY';
