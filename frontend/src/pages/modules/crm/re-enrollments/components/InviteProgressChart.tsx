import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DashboardStats } from '@/types/re-enrollment';

interface InviteProgressChartProps {
  stats: DashboardStats;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmados',
  SENT: 'Enviados',
  OPENED: 'Abertos',
  PENDING: 'Pendentes',
  DECLINED: 'Recusados',
  EXPIRED: 'Expirados',
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#10b981',
  SENT: '#f59e0b',
  OPENED: '#3b82f6',
  PENDING: '#a3a3a3',
  DECLINED: '#ef4444',
  EXPIRED: '#6b7280',
};

export default function InviteProgressChart({ stats }: InviteProgressChartProps) {
  const data = stats.statusCounts
    .filter((s) => s._count._all > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s._count._all,
      color: STATUS_COLORS[s.status] || '#a3a3a3',
    }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-neutral-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
          label={(props: PieLabelRenderProps) => `${props.name || ''} (${((props.percent || 0) * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [value, 'Convites']}
          contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => <span className="text-xs text-neutral-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
