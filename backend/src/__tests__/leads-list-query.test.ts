import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Wave 1 split: leads.service.ts is now a re-export shim. The findMany
// query and leadListInclude live in services/leads/leads-core.service.ts.
const leadsServiceSource = readFileSync(
  path.resolve(__dirname, '../services/leads/leads-core.service.ts'),
  'utf-8',
);

// CRM-02: findMany uses a lean include — no documents, no history, no parents as top-level includes
describe('Leads List Query', () => {
  it('findMany uses leadListInclude (no documents, no history, no parents as top-level relations)', () => {
    // Extract the leadListInclude object from source
    const includeBlock = leadsServiceSource.match(
      /const leadListInclude\s*=\s*\{([\s\S]*?)\};/,
    );
    expect(includeBlock).not.toBeNull();

    const block = includeBlock![1];

    // Must include lightweight relations
    expect(block).toContain('column');
    expect(block).toContain('children');
    expect(block).toContain('_count');

    // Must NOT include heavy top-level relations.
    // We check for these as keys (followed by colon or comma), not values inside _count.select.
    // Pattern: the word at the start of a line or after comma, used as a key.
    expect(block).not.toMatch(/^\s*history\s*[:{]/m);
    expect(block).not.toMatch(/^\s*parents\s*[:{]/m);
    // documents is only allowed inside _count.select, not as a top-level relation
    expect(block).not.toMatch(/^\s*documents\s*[:{]/m);
    expect(block).not.toMatch(/^\s*enrollmentDocuments\s*:/m);
  });

  it('findMany does NOT call refreshDocumentUrl', () => {
    // Extract the findMany function body up to the next exported function
    const findManyBody = leadsServiceSource.match(
      /export async function findMany[\s\S]*?(?=\nexport|\n\/\*\*)/,
    );
    expect(findManyBody).not.toBeNull();

    const body = findManyBody![0];
    expect(body).not.toContain('refreshDocumentUrl');
  });
});
