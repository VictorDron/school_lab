import { useState, useEffect } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { useUpdateAdjustment } from '@/hooks/usePreReEnrollment';

interface AdjustmentConfigProps {
  periodId: string;
  currentPercent: number | null;
  isLocked: boolean;
}

export default function AdjustmentConfig({
  periodId,
  currentPercent,
  isLocked,
}: AdjustmentConfigProps) {
  const [percent, setPercent] = useState<string>('');
  const updateMutation = useUpdateAdjustment(periodId);

  useEffect(() => {
    setPercent(currentPercent !== null ? String(currentPercent) : '');
  }, [currentPercent]);

  const handleApply = () => {
    const value = parseFloat(percent);
    if (isNaN(value)) return;
    updateMutation.mutate(value);
  };

  if (isLocked) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <Lock className="w-4 h-4" />
        Reajuste congelado para esta campanha.
        {currentPercent !== null && (
          <span className="font-medium text-neutral-700">{currentPercent}%</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="text-sm text-neutral-700 font-medium whitespace-nowrap">
          Percentual de Reajuste (%)
        </label>
        <input
          type="number"
          step={0.1}
          min={-100}
          max={200}
          value={percent}
          onChange={(e) => setPercent(e.target.value)}
          placeholder="0"
          className="w-24 px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <button
        onClick={handleApply}
        disabled={updateMutation.isPending || percent === ''}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
      >
        {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Aplicar
      </button>
      {percent && !isNaN(parseFloat(percent)) && (
        <span className="text-xs text-neutral-500">
          Aplicar {percent}% sobre os valores base
        </span>
      )}
    </div>
  );
}
