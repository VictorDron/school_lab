import { describe, it, expect } from 'vitest';
import { buildInitialItems, formatCurrency } from '../helpers';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const purchase = (overrides: any = {}) =>
  ({
    id: 'p1',
    code: 'PR-001',
    title: 'Compra teste',
    totalAmount: 100,
    items: [
      {
        id: 'i1',
        description: 'Cadeira',
        unit: 'un',
        quantity: 4,
        estimatedUnitPrice: 25,
      },
    ],
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

describe('formatCurrency', () => {
  it('formats a number as Brazilian currency with the R$ prefix and decimal comma', () => {
    expect(formatCurrency(1234.5)).toMatch(/^R\$\s1\.234,50$/);
  });

  it('renders zero with the R$ prefix and 0,00', () => {
    expect(formatCurrency(0)).toMatch(/^R\$\s0,00$/);
  });

  it('handles negative values with the minus sign', () => {
    expect(formatCurrency(-50)).toContain('50,00');
  });
});

describe('buildInitialItems', () => {
  it('seeds actuals from estimates so the user only edits where reality differs', () => {
    const [item] = buildInitialItems(purchase());
    expect(item.actualQuantity).toBe(4);
    expect(item.actualUnitPrice).toBe(25);
    expect(item.estimatedQuantity).toBe(4);
    expect(item.estimatedUnitPrice).toBe(25);
  });

  it('marks every item as included by default', () => {
    const items = buildInitialItems(
      purchase({
        items: [
          { id: 'i1', description: 'A', unit: 'un', quantity: 1, estimatedUnitPrice: 10 },
          { id: 'i2', description: 'B', unit: 'un', quantity: 2, estimatedUnitPrice: 20 },
        ],
      }),
    );
    expect(items.every((i) => i.included)).toBe(true);
  });

  it('starts with createAsset off and empty asset fields', () => {
    const [item] = buildInitialItems(purchase());
    expect(item.createAsset).toBe(false);
    expect(item.assetCategoryId).toBe('');
    expect(item.assetLocationId).toBe('');
  });

  it('preserves the source purchase item id so updates can be sent back', () => {
    const [item] = buildInitialItems(purchase());
    expect(item.purchaseItemId).toBe('i1');
  });

  it('returns an empty array when the purchase has no items', () => {
    expect(buildInitialItems(purchase({ items: [] }))).toEqual([]);
  });
});
