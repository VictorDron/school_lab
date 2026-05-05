import { describe, it, expect } from 'vitest';
import { getPaginationParams } from '../utils/helpers.js';

// CRM-04: getPaginationParams must enforce MAX_LIMIT=100 and DEFAULT_LIMIT=25
describe('Pagination Safety Cap', () => {
  it('getPaginationParams caps limit at MAX_LIMIT=100', () => {
    const result = getPaginationParams({ page: '1', limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('getPaginationParams defaults to DEFAULT_LIMIT=25', () => {
    const result = getPaginationParams({ page: '1' });
    expect(result.limit).toBe(25);
  });

  it('getPaginationParams defaults page to 1 when omitted', () => {
    const result = getPaginationParams({});
    expect(result.page).toBe(1);
  });

  it('getPaginationParams rejects negative values (clamps page to 1, limit to 1)', () => {
    const result = getPaginationParams({ page: '-5', limit: '-10' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('getPaginationParams computes correct skip for page 3 limit 10', () => {
    const result = getPaginationParams({ page: '3', limit: '10' });
    expect(result.skip).toBe(20);
  });
});
