import type { PurchaseRequest } from '@/types/procurement';
import type { ItemRow } from './types';

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/**
 * Build the initial editable rows from a purchase's items. Each row is
 * pre-checked, with actuals seeded from the estimates so the user only
 * needs to adjust where reality differs.
 */
export function buildInitialItems(purchase: PurchaseRequest): ItemRow[] {
  return purchase.items.map((item) => ({
    purchaseItemId: item.id,
    description: item.description,
    unit: item.unit,
    estimatedQuantity: item.quantity,
    estimatedUnitPrice: item.estimatedUnitPrice,
    actualQuantity: item.quantity,
    actualUnitPrice: item.estimatedUnitPrice,
    included: true,
    createAsset: false,
    assetCategoryId: '',
    assetLocationId: '',
  }));
}
