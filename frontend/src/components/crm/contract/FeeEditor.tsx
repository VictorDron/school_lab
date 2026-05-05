import { useState } from 'react';
import { XCircle, Plus, Loader2 } from 'lucide-react';
import type { FeeRow } from './constants';

interface FeeEditorProps {
  feeTable: FeeRow[];
  discountOptions: number[];
  onSave: (data: { feeTable: FeeRow[]; discountOptions: number[] }) => void;
  onClose: () => void;
  isSaving: boolean;
}

export function FeeEditor({ feeTable, discountOptions, onSave, onClose, isSaving }: FeeEditorProps) {
  const [editingFees, setEditingFees] = useState<FeeRow[]>([...feeTable]);
  const [editingDiscounts, setEditingDiscounts] = useState<number[]>([...discountOptions]);

  return (
    <div className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-700">Tabela de Precos por Faixa</h4>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wider">
              <th className="py-2 px-3 text-left">Faixa</th>
              <th className="py-2 px-3 text-right">Anuidade (R$)</th>
              <th className="py-2 px-3 text-right">Entrada (R$)</th>
            </tr>
          </thead>
          <tbody>
            {editingFees.map((row, idx) => (
              <tr key={row.faixa} className="border-t border-neutral-100">
                <td className="py-2 px-3 text-neutral-700 font-medium text-xs">{row.faixa}</td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="100"
                    value={row.anuidade}
                    onChange={(e) => {
                      const updated = [...editingFees];
                      updated[idx] = { ...updated[idx], anuidade: Number(e.target.value) };
                      setEditingFees(updated);
                    }}
                    className="w-full text-right border border-neutral-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="100"
                    value={row.entrada}
                    onChange={(e) => {
                      const updated = [...editingFees];
                      updated[idx] = { ...updated[idx], entrada: Number(e.target.value) };
                      setEditingFees(updated);
                    }}
                    className="w-full text-right border border-neutral-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Discount Options Editor */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-700 mb-2">Percentuais de Desconto</h4>
        <div className="flex flex-wrap gap-2">
          {editingDiscounts.sort((a, b) => a - b).map((val, idx) => (
            <div key={idx} className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={val}
                onChange={(e) => {
                  const updated = [...editingDiscounts];
                  updated[idx] = Number(e.target.value);
                  setEditingDiscounts(updated);
                }}
                className="w-16 text-center text-sm border border-neutral-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <span className="text-xs text-neutral-500">%</span>
              <button
                onClick={() => setEditingDiscounts(editingDiscounts.filter((_, i) => i !== idx))}
                className="text-neutral-400 hover:text-red-500 ml-1"
                title="Remover"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setEditingDiscounts([...editingDiscounts, 0])}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave({ feeTable: editingFees, discountOptions: editingDiscounts.sort((a, b) => a - b) })}
          disabled={isSaving}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
