import { UserMinus } from 'lucide-react';
import clsx from 'clsx';

interface EvasionRateCardProps {
  rate: number;
}

function getRateColor(rate: number): string {
  if (rate < 5) return 'text-green-600';
  if (rate <= 10) return 'text-amber-600';
  return 'text-red-600';
}

function getRateBg(rate: number): string {
  if (rate < 5) return 'bg-green-50';
  if (rate <= 10) return 'bg-amber-50';
  return 'bg-red-50';
}

export function EvasionRateCard({ rate }: EvasionRateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={clsx('p-2 rounded-lg', getRateBg(rate))}>
          <UserMinus className={clsx('w-5 h-5', getRateColor(rate))} />
        </div>
        <h3 className="text-sm font-semibold text-neutral-700">Taxa de Evasão</h3>
      </div>

      <p className={clsx('text-3xl font-bold', getRateColor(rate))}>
        {rate.toFixed(1)}%
      </p>

      <p className="text-xs text-neutral-500 mt-2">
        Alunos inativos, cancelados ou transferidos
      </p>
    </div>
  );
}
