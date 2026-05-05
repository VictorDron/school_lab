import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from './constants';
import type { PurchaseRequest } from '@/types/procurement';

// ── Component ─────────────────────────────────────────────────────────────────

export function ItensTab({ purchase }: { purchase: PurchaseRequest }) {
  const items = purchase.items || [];
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="p-4">
      {items.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
          <p className="text-sm">Nenhum item adicionado.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Descrição</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 w-16">Qtd</th>
                  <th className="text-center px-4 py-3 font-medium text-neutral-600 w-16">Un</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 w-28">P.Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-neutral-400">{index + 1}</td>
                    <td className="px-4 py-3 text-neutral-900">
                      <span className="font-medium">{item.description}</span>
                      {item.notes && (
                        <p className="text-xs text-neutral-500 mt-0.5">{item.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-center text-neutral-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-neutral-700">
                      {formatCurrency(item.estimatedUnitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-neutral-50">
                  <td colSpan={5} className="px-4 py-3 text-right font-semibold text-neutral-700">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-neutral-900">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
