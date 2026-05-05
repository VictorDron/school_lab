import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface YearComparisonCardsProps {
  data: Array<{ year: number; total: number }>;
}

export function YearComparisonCards({ data }: YearComparisonCardsProps) {
  // Show up to 3 most recent years
  const sorted = [...data].sort((a, b) => b.year - a.year).slice(0, 3);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {sorted.map((item, idx) => {
        const prevYear = sorted[idx + 1];
        let changePercent: number | null = null;

        if (prevYear && prevYear.total > 0) {
          changePercent = ((item.total - prevYear.total) / prevYear.total) * 100;
        }

        return (
          <div
            key={item.year}
            className="bg-white rounded-xl border border-neutral-200 p-4"
          >
            <p className="text-xs text-neutral-500 mb-1">Ano Letivo</p>
            <p className="text-2xl font-bold text-neutral-900">{item.year}</p>
            <p className="text-sm text-neutral-600 mt-1">
              {item.total} {item.total === 1 ? 'aluno' : 'alunos'}
            </p>

            <div className="mt-2 flex items-center gap-1">
              {changePercent === null ? (
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <Minus className="w-3.5 h-3.5" />
                  &mdash;
                </span>
              ) : changePercent >= 0 ? (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{changePercent.toFixed(1)}%
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {changePercent.toFixed(1)}%
                </span>
              )}
              {changePercent !== null && (
                <span className="text-xs text-neutral-400">vs {sorted[idx + 1]?.year}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
