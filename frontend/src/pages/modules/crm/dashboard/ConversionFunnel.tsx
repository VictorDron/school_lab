import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { DashboardStats } from './types';

interface ConversionFunnelProps {
  funnel: DashboardStats['funnel'];
}

const BRAND = '#0aacce';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string; payload: { stage: string; arrived: number; converted: number; rate: number } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-neutral-900 mb-1">{label}</p>
      <p className="text-neutral-600">
        Chegaram: <span className="font-medium text-amber-600">{d.arrived}</span>
      </p>
      <p className="text-neutral-600">
        Avançaram: <span className="font-medium text-emerald-600">{d.converted}</span>
      </p>
      <p className="text-neutral-600">
        Taxa: <span className="font-medium text-neutral-900">{d.rate}%</span>
      </p>
    </div>
  );
}

export function ConversionFunnel({ funnel }: ConversionFunnelProps) {
  if (!funnel?.stages?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const data = funnel.stages.map((s) => ({
    stage: s.label,
    arrived: s.count,
    converted: s.converted ?? 0,
    dropped: Math.max(0, s.count - (s.converted ?? 0)),
    rate: s.conversionRate ?? 0,
  }));

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: AMBER }} />
          Chegaram ao estágio
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: GREEN }} />
          Avançaram
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 8 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="stage"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="arrived" name="Chegaram" radius={[4, 4, 0, 0]} fill={AMBER} maxBarSize={56}>
            <LabelList
              dataKey="rate"
              position="top"
              formatter={(v: unknown) => (typeof v === 'number' && v > 0 ? `${v}%` : '')}
              style={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
            />
          </Bar>
          <Bar dataKey="converted" name="Avançaram" radius={[4, 4, 0, 0]} fill={GREEN} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>

      {/* Stage conversion rates row */}
      <div className="flex gap-2 mt-2 flex-wrap">
        {data.map((d) => (
          <div key={d.stage} className="flex items-center gap-1 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{d.stage}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                d.rate >= 70
                  ? 'bg-emerald-100 text-emerald-700'
                  : d.rate >= 40
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {d.rate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
