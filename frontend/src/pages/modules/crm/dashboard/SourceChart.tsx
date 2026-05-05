import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardStats } from './types';

interface SourceChartProps {
  bySource: DashboardStats['bySource'];
}

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Website',
  REFERRAL: 'Indicação',
  SOCIAL_MEDIA: 'Redes Sociais',
  EVENT: 'Evento',
  ADVERTISEMENT: 'Publicidade',
  WALK_IN: 'Presencial',
  PHONE: 'Telefone',
  EMAIL: 'Email',
  OTHER: 'Outros',
};

const COLORS = [
  '#0aacce',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: { source: string; count: number; pct: number; conversionRate?: number } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-neutral-900 mb-1">{SOURCE_LABELS[d.source] ?? d.source}</p>
      <p className="text-neutral-600">
        Leads: <span className="font-medium">{d.count}</span>
      </p>
      <p className="text-neutral-600">
        Participação: <span className="font-medium">{d.pct.toFixed(1)}%</span>
      </p>
      {d.conversionRate != null && (
        <p className="text-neutral-600">
          Conversão: <span className="font-medium text-emerald-600">{d.conversionRate.toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
}

export function SourceChart({ bySource }: SourceChartProps) {
  if (!bySource?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const total = bySource.reduce((acc, s) => acc + s.count, 0);
  const data = bySource.map((s) => ({
    ...s,
    label: SOURCE_LABELS[s.source] ?? s.source,
    pct: total > 0 ? (s.count / total) * 100 : 0,
  }));

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut */}
      <div className="relative flex-shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={84}
              dataKey="count"
              nameKey="label"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-neutral-900">{total}</span>
          <span className="text-[10px] text-neutral-500 font-medium">leads</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {data.map((d, idx) => (
          <div key={d.source} className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: COLORS[idx % COLORS.length] }}
            />
            <span className="text-xs text-neutral-700 truncate flex-1">{d.label}</span>
            <span className="text-xs font-semibold text-neutral-900 flex-shrink-0">{d.count}</span>
            {d.conversionRate != null && (
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0">
                {d.conversionRate.toFixed(0)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
