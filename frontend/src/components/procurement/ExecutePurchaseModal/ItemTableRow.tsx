import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from './helpers';
import type { ItemRow } from './types';

interface AssetOption {
  id: string;
  name: string;
}

interface ItemTableRowProps {
  item: ItemRow;
  index: number;
  onUpdate: (index: number, updates: Partial<ItemRow>) => void;
  categories: AssetOption[];
  locations: AssetOption[];
}

export function ItemTableRow({ item, index, onUpdate, categories, locations }: ItemTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const itemTotal = item.actualQuantity * item.actualUnitPrice;

  return (
    <>
      <tr className={`${!item.included ? 'opacity-50' : ''} transition-opacity`}>
        <td className="px-3 py-2.5">
          <input
            type="checkbox"
            checked={item.included}
            onChange={(e) => onUpdate(index, { included: e.target.checked })}
            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
        </td>
        <td className="px-3 py-2.5">
          <span className="font-medium text-neutral-800">{item.description}</span>
          <span className="text-neutral-400 ml-1.5 text-xs">({item.unit})</span>
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            min={1}
            value={item.actualQuantity}
            onChange={(e) =>
              onUpdate(index, { actualQuantity: Math.max(1, Number(e.target.value)) })
            }
            disabled={!item.included}
            className="input text-center w-20 mx-auto"
          />
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            min={0}
            step={0.01}
            value={item.actualUnitPrice}
            onChange={(e) =>
              onUpdate(index, { actualUnitPrice: Math.max(0, Number(e.target.value)) })
            }
            disabled={!item.included}
            className="input text-right w-28 ml-auto"
          />
        </td>
        <td className="px-3 py-2.5 text-right font-medium text-neutral-800">
          {formatCurrency(item.included ? itemTotal : 0)}
        </td>
        <td className="px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <input
              type="checkbox"
              checked={item.createAsset}
              onChange={(e) => {
                onUpdate(index, { createAsset: e.target.checked });
                if (e.target.checked) setExpanded(true);
              }}
              disabled={!item.included}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            {item.createAsset && item.included && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="p-0.5 text-neutral-400 hover:text-neutral-600"
              >
                {expanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </td>
      </tr>

      {item.createAsset && item.included && expanded && (
        <tr className="bg-primary-50/30">
          <td />
          <td colSpan={5} className="px-3 py-3">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="label text-xs">Categoria do Ativo *</label>
                <select
                  value={item.assetCategoryId}
                  onChange={(e) => onUpdate(index, { assetCategoryId: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">Selecione...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="label text-xs">Localização *</label>
                <select
                  value={item.assetLocationId}
                  onChange={(e) => onUpdate(index, { assetLocationId: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">Selecione...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
