import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import type { DashboardStats } from './types';

interface MonthlyTrendChartProps {
  monthlyTrend: DashboardStats['monthlyTrend'];
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const BRAND = '#0aacce';
const GREEN = '#10b981';
const RED = '#ef4444';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs min-w-[120px]">
      <p className="font-semibold text-neutral-900 mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-neutral-900">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function MonthlyTrendChart({ monthlyTrend }: MonthlyTrendChartProps) {
  if (!monthlyTrend?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const data = monthlyTrend.map((m) => ({
    ...m,
    month: MONTH_LABELS[(m.month ?? 1) - 1] ?? m.month,
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="gradientCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BRAND} stopOpacity={0.18} />
              <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8 }}
            formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Criados"
            stroke={BRAND}
            strokeWidth={2}
            fill="url(#gradientCreated)"
            dot={{ r: 3, fill: BRAND, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="enrolled"
            name="Matriculados"
            stroke={GREEN}
            strokeWidth={2}
            dot={{ r: 3, fill: GREEN, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="rejected"
            name="Rejeitados"
            stroke={RED}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3, fill: RED, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
