import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { StudentDashboardStats } from '@/types/students';

interface StatusDistributionChartProps {
  data: StudentDashboardStats['byStatus'];
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  TRANSFERRED: 'Transferido',
  GRADUATED: 'Graduado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  INACTIVE: '#a3a3a3',
  TRANSFERRED: '#3b82f6',
  GRADUATED: '#8b5cf6',
  CANCELLED: '#ef4444',
};

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  const chartData = data
    .map((entry) => ({
      name: STATUS_LABELS[entry.status] ?? entry.status,
      value: entry._count.id,
      status: entry.status,
    }))
    .filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 mb-1">Distribuição por Status</h3>
      <p className="text-xs text-neutral-400 mb-5">Situação atual dos alunos</p>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-neutral-400 text-sm">
          Nenhum dado disponível.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: '13px',
                }}
                formatter={(value) => [String(value), 'Alunos']}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-2 mt-4">
            {chartData.map((entry) => {
              const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
              return (
                <div key={entry.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] ?? '#94a3b8' }}
                    />
                    <span className="text-neutral-600">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">{entry.value}</span>
                    <span className="text-neutral-400 text-xs">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
