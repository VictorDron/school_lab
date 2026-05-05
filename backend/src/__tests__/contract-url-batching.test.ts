import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const contractServiceSource = readFileSync(
  path.resolve(__dirname, '../services/contract/contract-core.service.ts'),
  'utf-8',
);

// Wave 1 split: leads.service.ts is now a re-export shim. BATCH_SIZE and
// findById live in services/leads/leads-core.service.ts.
const leadsServiceSource = readFileSync(
  path.resolve(__dirname, '../services/leads/leads-core.service.ts'),
  'utf-8',
);

// CRM-02: URL refresh must be batched — no unbounded Promise.all
describe('Contract URL Batching', () => {
  it('contract.service.ts defines BATCH_SIZE = 5', () => {
    expect(contractServiceSource).toContain('BATCH_SIZE = 5');
  });

  it('findByLeadId refreshes URLs in batches of BATCH_SIZE=5, not unbounded', () => {
    // The old unbounded pattern should no longer be present
    expect(contractServiceSource).not.toMatch(
      /Promise\.all\(\s*contracts\.map\(/,
    );

    // The new batched pattern must be present
    expect(contractServiceSource).toMatch(/i\s*\+=\s*BATCH_SIZE/);
  });

  it('leads.service.ts defines BATCH_SIZE = 5', () => {
    expect(leadsServiceSource).toContain('BATCH_SIZE = 5');
  });

  it('findById refreshes document URLs in batches of BATCH_SIZE=5, not unbounded', () => {
    // The old unbounded pattern should no longer be present
    expect(leadsServiceSource).not.toMatch(
      /Promise\.all\(\s*lead\.documents\.map\(/,
    );

    // The new batched pattern must be present
    expect(leadsServiceSource).toMatch(/i\s*\+=\s*BATCH_SIZE/);
  });
});
