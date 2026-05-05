import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import type { BottleneckStage } from '@/types/re-enrollment';

interface BottleneckPanelProps {
  bottlenecks: BottleneckStage[];
}

export default function BottleneckPanel({ bottlenecks }: BottleneckPanelProps) {
  const allEmpty = bottlenecks.every((b) => b.count === 0);
  const hasBottleneck = bottlenecks.some((b) => b.isBottleneck);

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">Análise de Gargalos</h3>
      </div>

      {allEmpty ? (
        <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
          Sem dados para análise.
        </div>
      ) : !hasBottleneck ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-emerald-700">
            Nenhum gargalo identificado — funil equilibrado.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {bottlenecks.map((stage) => (
            <div key={stage.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {stage.isBottleneck && (
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                  <span className={stage.isBottleneck ? 'font-bold text-red-700' : 'text-neutral-600'}>
                    {stage.stageName}
                  </span>
                </div>
                <span className={stage.isBottleneck ? 'font-bold text-red-600' : 'text-neutral-500'}>
                  {stage.count} ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-neutral-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${stage.isBottleneck ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
