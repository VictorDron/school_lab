import { Loader2, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePreReEnrollmentReport } from '@/hooks/usePreReEnrollment';

interface PreReEnrollmentReportProps {
  periodId: string;
}

const CARD_CONFIG = [
  { key: 'total', label: 'Total Comunicados', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'agreed', label: 'Concordaram', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'disagreed', label: 'Discordaram', color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'noResponse', label: 'Sem Resposta', color: 'text-neutral-500', bg: 'bg-neutral-100' },
  { key: 'negotiating', label: 'Em Negociação', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'negotiated', label: 'Negociado', color: 'text-blue-600', bg: 'bg-blue-50' },
] as const;

const BAR_COLORS = {
  agreed: '#10b981',
  disagreed: '#ef4444',
  noResponse: '#9ca3af',
  negotiating: '#f59e0b',
  negotiated: '#3b82f6',
};

export default function PreReEnrollmentReport({ periodId }: PreReEnrollmentReportProps) {
  const { data, isLoading } = usePreReEnrollmentReport(periodId);
  const report = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!report || report.total === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-teal-50">
            <BarChart3 className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-800">
            Relatório de Pré-Rematrícula
          </h3>
        </div>
        <p className="text-xs text-neutral-400 py-6 text-center">
          Nenhum dado disponível para o relatório. Envie as comunicações primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-teal-50">
          <BarChart3 className="w-4 h-4 text-teal-600" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800">
          Relatório de Pré-Rematrícula
        </h3>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {CARD_CONFIG.map((card) => (
          <div
            key={card.key}
            className="bg-white border border-neutral-200 rounded-lg p-3 text-center"
          >
            <div className="text-[10px] font-medium text-neutral-500 mb-1">{card.label}</div>
            <div className={`text-xl font-bold ${card.color}`}>
              {report[card.key as keyof typeof report] as number}
            </div>
          </div>
        ))}
      </div>

      {/* Highlighted metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 text-center">
          <div className="text-xs font-medium text-emerald-600 mb-1">Taxa de Adesão</div>
          <div className="text-3xl font-bold text-emerald-700">
            {report.adhesionRate.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-xs font-medium text-blue-600 mb-1">
            Reajuste Médio Efetivo
          </div>
          <div className="text-3xl font-bold text-blue-700">
            {report.averageEffectiveAdjustment.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Bar chart by grade */}
      {report.byGrade.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-neutral-700 mb-3">
            Respostas por Série
          </h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={report.byGrade} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar
                dataKey="agreed"
                name="Concordaram"
                stackId="status"
                fill={BAR_COLORS.agreed}
              />
              <Bar
                dataKey="disagreed"
                name="Discordaram"
                stackId="status"
                fill={BAR_COLORS.disagreed}
              />
              <Bar
                dataKey="noResponse"
                name="Sem Resposta"
                stackId="status"
                fill={BAR_COLORS.noResponse}
              />
              <Bar
                dataKey="negotiating"
                name="Em Negociação"
                stackId="status"
                fill={BAR_COLORS.negotiating}
              />
              <Bar
                dataKey="negotiated"
                name="Negociado"
                stackId="status"
                fill={BAR_COLORS.negotiated}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
