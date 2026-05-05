import { formatCurrency } from './helpers';

interface TotalsComparisonProps {
  estimatedTotal: number;
  actualTotal: number;
}

export function TotalsComparison({ estimatedTotal, actualTotal }: TotalsComparisonProps) {
  const delta = actualTotal - estimatedTotal;
  const deltaPercent = estimatedTotal > 0 ? (delta / estimatedTotal) * 100 : 0;

  const deltaColor =
    delta > 0
      ? 'text-error-600 font-medium'
      : delta < 0
        ? 'text-success-600 font-medium'
        : 'text-neutral-500';

  return (
    <div className="bg-neutral-50 rounded-xl p-4 space-y-2 border border-neutral-200">
      <div className="flex justify-between text-sm text-neutral-600">
        <span>Total Estimado</span>
        <span>{formatCurrency(estimatedTotal)}</span>
      </div>
      <div className="flex justify-between text-sm font-semibold text-neutral-900">
        <span>Total Real</span>
        <span>{formatCurrency(actualTotal)}</span>
      </div>
      <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm">
        <span className="text-neutral-600">Diferença</span>
        <span className={deltaColor}>
          {delta > 0 ? '+' : ''}
          {formatCurrency(delta)} ({delta > 0 ? '+' : ''}
          {deltaPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
