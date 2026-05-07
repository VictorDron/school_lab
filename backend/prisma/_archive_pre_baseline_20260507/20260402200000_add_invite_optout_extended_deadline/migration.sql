-- AlterTable: Add optOutReminders and extendedDeadline to ReEnrollmentInvite
ALTER TABLE "ReEnrollmentInvite" ADD COLUMN "optOutReminders" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ReEnrollmentInvite" ADD COLUMN "extendedDeadline" TIMESTAMP(3);
