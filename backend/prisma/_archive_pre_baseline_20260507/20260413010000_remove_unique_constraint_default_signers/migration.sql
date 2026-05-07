-- Drop the unique constraint on (role, email) to allow multiple signers with same role+email
DROP INDEX IF EXISTS "ContractDefaultSigner_role_email_key";
