-- AlterTable
-- Rename vehicles column to familyVehicles
ALTER TABLE "LeadTransport" RENAME COLUMN "vehicles" TO "familyVehicles";

-- AlterTable
-- Change dropoffPickupPerson from String to Json array and rename to dropoffPickupPersons
-- First, convert existing data to JSON array format
ALTER TABLE "LeadTransport"
  ADD COLUMN "dropoffPickupPersons" JSONB;

-- Migrate existing data: wrap single values in an array
UPDATE "LeadTransport"
  SET "dropoffPickupPersons" =
    CASE
      WHEN "dropoffPickupPerson" IS NOT NULL AND "dropoffPickupPerson" != ''
      THEN jsonb_build_array("dropoffPickupPerson")
      ELSE NULL
    END;

-- Drop old column
ALTER TABLE "LeadTransport" DROP COLUMN "dropoffPickupPerson";
