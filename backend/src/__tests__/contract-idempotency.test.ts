/**
 * contract-idempotency.test.ts
 *
 * Tests validating the partial unique index migration for Contract table.
 *
 * BUG-01: Race condition on contract creation — two concurrent transactions
 * could both read "no active contract" and both insert, resulting in duplicates.
 * The database-level partial unique index is the only correct fix.
 *
 * The migration enforces: at most one Contract row per leadId WHERE status != 'CANCELLED'.
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.resolve(
  __dirname,
  '../../prisma/migrations/20260330200000_add_contract_active_unique_index/migration.sql',
);
const migrationSql = readFileSync(migrationPath, 'utf-8');

describe('Contract idempotency — partial unique index', () => {
  describe('Migration SQL correctness', () => {
    it('should have migration file with partial unique index', () => {
      expect(migrationSql).toContain('CREATE UNIQUE INDEX "Contract_leadId_active_unique"');
    });

    it('should exclude CANCELLED contracts from unique constraint', () => {
      expect(migrationSql).toContain("WHERE \"status\" != 'CANCELLED'");
    });

    it('should index on leadId column', () => {
      expect(migrationSql).toContain('("leadId")');
    });

    it('should target the Contract table', () => {
      expect(migrationSql).toContain('ON "Contract"');
    });
  });

  describe('ContractStatus enum includes CANCELLED', () => {
    it('ContractStatus enum includes CANCELLED', async () => {
      const { ContractStatus } = await import('@prisma/client');
      expect(Object.values(ContractStatus)).toContain('CANCELLED');
    });
  });

  describe('Application-level guard in createContract', () => {
    it('should read the service source and verify notIn CANCELLED check exists', () => {
      const servicePath = path.resolve(
        __dirname,
        '../services/contract/contract-core.service.ts',
      );
      const serviceSource = readFileSync(servicePath, 'utf-8');

      // The application-level guard must still exist as defense-in-depth.
      // The DB index is the atomic-safe guard; the app check is an early exit.
      expect(serviceSource).toContain("notIn: ['CANCELLED']");
      expect(serviceSource).toContain('CONTRACT_ALREADY_EXISTS');
    });
  });
});
