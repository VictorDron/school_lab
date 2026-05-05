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

interface GradeRankingProps {
  byGrade: DashboardStats['byGrade'];
}

const BRAND = '#0aacce';

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { grade: string; count: number; conversionRate?: number } }[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-neutral-900 mb-1">{label}</p>
      <p className="text-neutral-600">
        Leads: <span className="font-medium">{d.count}</span>
      </p>
      {d.conversionRate != null && (
        <p className="text-neutral-600">
          Conversão: <span className="font-medium text-emerald-600">{d.conversionRate.toFixed(1)}%</span>
        </p>
      )}
    </div>
  );
}

export function GradeRanking({ byGrade }: GradeRankingProps) {
  if (!byGrade?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const sorted = [...byGrade].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={Math.max(240, sorted.length * 36)}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="grade"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={88}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="count" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={20}>
            {sorted.map((entry, idx) => (
              <Cell key={idx} fill={BRAND} opacity={1 - idx * 0.06} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion rate badges row */}
      <div className="mt-2 space-y-1">
        {sorted.map((d) =>
          d.conversionRate != null ? (
            <div key={d.grade} className="flex items-center justify-between text-xs text-neutral-500">
              <span>{d.grade}</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                {d.conversionRate.toFixed(0)}% conv.
              </span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
