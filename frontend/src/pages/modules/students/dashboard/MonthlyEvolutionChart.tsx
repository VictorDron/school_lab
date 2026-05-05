import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface MonthlyEvolutionChartProps {
  data: Array<{ month: string; count: number }>;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Fev',
  '03': 'Mar',
  '04': 'Abr',
  '05': 'Mai',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Ago',
  '09': 'Set',
  '10': 'Out',
  '11': 'Nov',
  '12': 'Dez',
};

function getMonthLabel(month: string): string {
  // month can be "01", "02", ..., "12" or "2026-01", etc.
  const parts = month.split('-');
  const key = parts.length > 1 ? parts[parts.length - 1] : month;
  return MONTH_LABELS[key] ?? month;
}

export function MonthlyEvolutionChart({ data }: MonthlyEvolutionChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: getMonthLabel(d.month),
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-700 mb-4">
        Evolução Mensal de Matrículas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#737373' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: '#737373' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}`, 'Matrículas']}
            labelFormatter={(label) => `Mês: ${label}`}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e5e5',
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#monthlyGradient)"
            dot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#7c3aed' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
