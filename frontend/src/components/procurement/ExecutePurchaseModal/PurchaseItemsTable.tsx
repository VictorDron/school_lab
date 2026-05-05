import { ShoppingCart } from 'lucide-react';
import { ItemTableRow } from './ItemTableRow';
import type { ItemRow } from './types';

interface AssetOption {
  id: string;
  name: string;
}

interface PurchaseItemsTableProps {
  items: ItemRow[];
  setItems: (updater: (prev: ItemRow[]) => ItemRow[]) => void;
  onUpdateItem: (index: number, updates: Partial<ItemRow>) => void;
  categories: AssetOption[];
  locations: AssetOption[];
}

export function PurchaseItemsTable({
  items,
  setItems,
  onUpdateItem,
  categories,
  locations,
}: PurchaseItemsTableProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <ShoppingCart className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Itens da Compra
        </span>
      </div>

      <div className="overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600 text-left">
              <th className="px-3 py-2.5 w-10">
                <input
                  type="checkbox"
                  checked={items.every((i) => i.included)}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((item) => ({ ...item, included: e.target.checked })),
                    )
                  }
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-3 py-2.5">Descrição</th>
              <th className="px-3 py-2.5 w-24 text-center">Qtd</th>
              <th className="px-3 py-2.5 w-32 text-right">Preço Unit.</th>
              <th className="px-3 py-2.5 w-32 text-right">Total</th>
              <th className="px-3 py-2.5 w-28 text-center">Criar Ativo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item, index) => (
              <ItemTableRow
                key={item.purchaseItemId}
                item={item}
                index={index}
                onUpdate={onUpdateItem}
                categories={categories}
                locations={locations}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
