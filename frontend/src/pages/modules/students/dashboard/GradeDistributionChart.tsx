import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { StudentDashboardStats } from '@/types/students';

interface GradeDistributionChartProps {
  data: StudentDashboardStats['byGrade'];
}

export function GradeDistributionChart({ data }: GradeDistributionChartProps) {
  const chartData = data.map((entry) => ({
    grade: entry.grade ?? 'Sem turma',
    count: entry._count.id,
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 mb-1">Distribuição por Turma</h3>
      <p className="text-xs text-neutral-400 mb-5">Quantidade de alunos em cada série</p>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-neutral-400 text-sm">
          Nenhum dado disponível.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 50, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
            <XAxis
              dataKey="grade"
              angle={-45}
              textAnchor="end"
              height={70}
              tick={{ fontSize: 11, fill: '#737373' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#a3a3a3' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #f0f0f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontSize: '13px',
              }}
              formatter={(value) => [String(value), 'Alunos']}
              cursor={{ fill: 'rgba(124, 58, 237, 0.04)' }}
            />
            <Bar
              dataKey="count"
              fill="#7c3aed"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
