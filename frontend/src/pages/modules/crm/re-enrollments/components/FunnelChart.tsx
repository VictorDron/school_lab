import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { FunnelStage } from '@/types/re-enrollment';

interface FunnelChartProps {
  stages: FunnelStage[];
}

const STAGE_COLORS = [
  '#06b6d4', // cyan-500
  '#0891b2', // cyan-600
  '#0e7490', // cyan-700
  '#155e75', // cyan-800
  '#164e63', // cyan-900
  '#134e4a', // teal-900
];

export default function FunnelChart({ stages }: FunnelChartProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-50">
            <BarChart3 className="w-4 h-4 text-cyan-600" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">Funil de Rematrícula</h3>
        </div>
        <div className="flex items-center justify-center h-[300px] text-neutral-400 text-sm">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  const data = stages.map((stage, index) => ({
    name: stage.name,
    count: stage.count,
    percentage: stage.percentage,
    avgDays: stage.avgDaysInStage,
    fill: STAGE_COLORS[index % STAGE_COLORS.length],
  }));

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-cyan-50">
          <BarChart3 className="w-4 h-4 text-cyan-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">Funil de Rematrícula</h3>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(300, stages.length * 56)}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 80, left: 10, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={200}
            tick={{ fontSize: 12, fill: '#525252' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value, _name, entry) => {
              const avgDays = entry?.payload?.avgDays;
              const avgLabel = avgDays != null ? `${avgDays}d` : '-';
              const pct = entry?.payload?.percentage;
              return [`${value} (${pct != null ? pct.toFixed(1) : 0}%) | Tempo médio: ~${avgLabel}`, 'Famílias'];
            }}
            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              style={{ fontSize: 11, fill: '#737373', fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Average days legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-neutral-400">
        {stages.map((stage) => (
          <span key={stage.key}>
            {stage.name}: <span className="font-medium text-neutral-500">~{stage.avgDaysInStage != null ? `${stage.avgDaysInStage}d` : '-'}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
