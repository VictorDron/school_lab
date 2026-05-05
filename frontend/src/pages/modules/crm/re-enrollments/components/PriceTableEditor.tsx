import { useState, useEffect } from 'react';
import { XCircle, Plus, Loader2, Lock, Pencil, ChevronDown } from 'lucide-react';
import { useUpdatePriceTable } from '@/hooks/usePreReEnrollment';
import type { PriceTableEntry } from '@/types/pre-reenrollment';

interface PriceTableEditorProps {
  periodId: string;
  entries: PriceTableEntry[];
  eligibleGrades: string[];
  discountOptions: number[];
  isLocked: boolean;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

// Mapeamento de séries individuais para faixas de preço (mesmos defaults de contratos)
const FAIXA_DEFAULTS: Record<string, { anuidade: number; entrada: number }> = {
  'Nursery ao Pre-K4': { anuidade: 69600, entrada: 1400 },
  'Kinder': { anuidade: 75600, entrada: 1400 },
  '1º ao 2º ano': { anuidade: 82800, entrada: 1400 },
  '3º ao 5º ano': { anuidade: 87600, entrada: 1400 },
  '6º ano': { anuidade: 93600, entrada: 1400 },
  '7º ao 8º': { anuidade: 100800, entrada: 1400 },
  '9º ao 11º ano': { anuidade: 106800, entrada: 1400 },
  '12º ano': { anuidade: 106800, entrada: 1400 },
};

const GRADE_TO_FAIXA: Record<string, string> = {
  'Nursery': 'Nursery ao Pre-K4',
  'Pre-K3': 'Nursery ao Pre-K4',
  'Pre-K4': 'Nursery ao Pre-K4',
  'Kindergarten': 'Kinder',
  '1st Grade': '1º ao 2º ano',
  '2nd Grade': '1º ao 2º ano',
  '3rd Grade': '3º ao 5º ano',
  '4th Grade': '3º ao 5º ano',
  '5th Grade': '3º ao 5º ano',
  '6th Grade': '6º ano',
  '7th Grade': '7º ao 8º',
  '8th Grade': '7º ao 8º',
  '9th Grade': '9º ao 11º ano',
  '10th Grade': '9º ao 11º ano',
  '11th Grade': '9º ao 11º ano',
  '12th Grade': '12º ano',
};

function getDefaultForGrade(grade: string) {
  const faixa = GRADE_TO_FAIXA[grade];
  if (!faixa) return { baseAnnualValue: 0, enrollmentFee: 0 };
  const defaults = FAIXA_DEFAULTS[faixa];
  if (!defaults) return { baseAnnualValue: 0, enrollmentFee: 0 };
  return { baseAnnualValue: defaults.anuidade, enrollmentFee: defaults.entrada };
}

function buildRows(eligibleGrades: string[], entries: PriceTableEntry[]) {
  const entryMap = new Map(entries.map((e) => [e.grade, e]));
  return eligibleGrades.map((grade) => {
    const existing = entryMap.get(grade);
    if (existing && existing.baseAnnualValue > 0) {
      return {
        grade,
        baseAnnualValue: existing.baseAnnualValue,
        enrollmentFee: existing.enrollmentFee,
        discountPercent: existing.discountPercent,
      };
    }
    const defaults = getDefaultForGrade(grade);
    return {
      grade,
      baseAnnualValue: defaults.baseAnnualValue,
      enrollmentFee: defaults.enrollmentFee,
      discountPercent: null,
    };
  });
}

export default function PriceTableEditor({
  periodId,
  entries,
  eligibleGrades,
  discountOptions: initialDiscountOptions,
  isLocked,
}: PriceTableEditorProps) {
  const hasSavedEntries = entries.some((e) => e.baseAnnualValue > 0);
  const [isEditing, setIsEditing] = useState(!hasSavedEntries);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingFees, setEditingFees] = useState(buildRows(eligibleGrades, entries));
  const [editingDiscounts, setEditingDiscounts] = useState<number[]>([...initialDiscountOptions]);
  const updateMutation = useUpdatePriceTable(periodId);

  useEffect(() => {
    setEditingFees(buildRows(eligibleGrades, entries));
    if (entries.some((e) => e.baseAnnualValue > 0)) {
      setIsEditing(false);
    }
  }, [eligibleGrades, entries]);

  useEffect(() => {
    setEditingDiscounts([...initialDiscountOptions]);
  }, [initialDiscountOptions]);

  const handleSave = () => {
    const valid = editingFees.filter((r) => r.grade);
    if (valid.length === 0) return;
    updateMutation.mutate(
      {
        entries: valid,
        discountOptions: editingDiscounts.sort((a, b) => a - b),
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  if (isLocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Lock className="w-4 h-4" />
          Preços congelados para esta campanha.
        </div>

        {entries.length > 0 && (
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
                {entries.map((row) => (
                  <tr key={row.grade} className="border-t border-neutral-100">
                    <td className="py-2 px-3 text-neutral-700 font-medium text-xs">{row.grade}</td>
                    <td className="py-2 px-3 text-right text-neutral-700">
                      {currencyFormatter.format(row.baseAnnualValue)}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-700">
                      {currencyFormatter.format(row.enrollmentFee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {initialDiscountOptions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-neutral-700 mb-2">Percentuais de Desconto</h4>
            <div className="flex flex-wrap gap-2">
              {initialDiscountOptions.sort((a, b) => a - b).map((val, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-600"
                >
                  {val}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── View mode: colapsável com resumo compacto ──
  if (!isEditing) {
    const displayRows = buildRows(eligibleGrades, entries);
    const values = displayRows.map((r) => r.baseAnnualValue).filter((v) => v > 0);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;

    return (
      <div className="space-y-3">
        {/* Resumo compacto + toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-1 group"
        >
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <span className="font-medium text-neutral-800">{displayRows.length} séries configuradas</span>
            <span className="text-neutral-400">•</span>
            <span>{currencyFormatter.format(minValue)} – {currencyFormatter.format(maxValue)}</span>
            {initialDiscountOptions.length > 0 && (
              <>
                <span className="text-neutral-400">•</span>
                <span>Descontos: {initialDiscountOptions.sort((a, b) => a - b).map((v) => `${v}%`).join(', ')}</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Conteúdo expandido */}
        {isExpanded && (
          <>
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
                  {displayRows.map((row) => (
                    <tr key={row.grade} className="border-t border-neutral-100">
                      <td className="py-2 px-3 text-neutral-700 font-medium text-xs">{row.grade}</td>
                      <td className="py-2 px-3 text-right text-neutral-700">
                        {currencyFormatter.format(row.baseAnnualValue)}
                      </td>
                      <td className="py-2 px-3 text-right text-neutral-700">
                        {currencyFormatter.format(row.enrollmentFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingFees(buildRows(eligibleGrades, entries));
                  setEditingDiscounts([...initialDiscountOptions]);
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Configurar Valores
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Edit mode: inputs editáveis ──
  return (
    <div className="space-y-4">
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
            {editingFees.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-sm text-neutral-400">
                  Nenhuma série elegível configurada para esta campanha.
                </td>
              </tr>
            ) : (
              editingFees.map((row, idx) => (
                <tr key={row.grade} className="border-t border-neutral-100">
                  <td className="py-2 px-3 text-neutral-700 font-medium text-xs">{row.grade}</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="100"
                      value={row.baseAnnualValue || ''}
                      onChange={(e) => {
                        const updated = [...editingFees];
                        updated[idx] = { ...updated[idx], baseAnnualValue: Number(e.target.value) || 0 };
                        setEditingFees(updated);
                      }}
                      placeholder="0"
                      className="w-full text-right border border-neutral-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="100"
                      value={row.enrollmentFee || ''}
                      onChange={(e) => {
                        const updated = [...editingFees];
                        updated[idx] = { ...updated[idx], enrollmentFee: Number(e.target.value) || 0 };
                        setEditingFees(updated);
                      }}
                      placeholder="0"
                      className="w-full text-right border border-neutral-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-cyan-500 outline-none"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Percentuais de Desconto */}
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
                className="w-16 text-center text-sm border border-neutral-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-cyan-500 outline-none"
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
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-600 border border-cyan-200 rounded-lg hover:bg-cyan-50"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setEditingFees(buildRows(eligibleGrades, entries));
            setEditingDiscounts([...initialDiscountOptions]);
            setIsEditing(false);
          }}
          className="px-3 py-1.5 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-3 py-1.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50"
        >
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
