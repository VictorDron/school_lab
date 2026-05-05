import {
  Users,
  CalendarPlus,
  Zap,
  Loader,
  GraduationCap,
  XCircle,
  TrendingUp,
  Clock,
  TrendingDown,
} from 'lucide-react';
import type { DashboardStats } from './types';

interface SummaryCardsProps {
  summary: DashboardStats['summary'];
}

interface CardConfig {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  iconBg: string;
  growth?: number | null;
}

function GrowthIndicator({ growth }: { growth: number }) {
  const isPositive = growth >= 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isPositive ? '+' : ''}
      {growth.toFixed(1)}%
    </span>
  );
}

function MetricCard({ label, value, subValue, icon, iconBg, growth }: CardConfig) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        {growth != null && <GrowthIndicator growth={growth} />}
      </div>
      <p className="text-3xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
      {subValue && <p className="text-xs text-neutral-400 mt-1">{subValue}</p>}
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const thisMonth = summary?.thisMonth ?? 0;
  const lastMonth = summary?.lastMonth ?? 0;
  const growth =
    lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;

  const cards: CardConfig[] = [
    {
      label: 'Total de Leads',
      value: summary?.total ?? 0,
      icon: <Users className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      label: 'Este Mês',
      value: thisMonth,
      icon: <CalendarPlus className="w-4 h-4 text-cyan-600" />,
      iconBg: 'bg-cyan-50',
      growth,
    },
    {
      label: 'Hoje',
      value: summary?.today ?? 0,
      icon: <Zap className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Em Andamento',
      value: summary?.inProgress ?? 0,
      icon: <Loader className="w-4 h-4 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
    },
    {
      label: 'Matriculados',
      value: summary?.enrolled ?? 0,
      subValue:
        summary?.enrolledThisMonth != null
          ? `${summary.enrolledThisMonth} este mês`
          : undefined,
      icon: <GraduationCap className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Rejeitados',
      value: summary?.rejected ?? 0,
      icon: <XCircle className="w-4 h-4 text-red-500" />,
      iconBg: 'bg-red-50',
    },
    {
      label: 'Taxa de Conversão',
      value:
        summary?.conversionRate != null
          ? `${summary.conversionRate.toFixed(1)}%`
          : '—',
      icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      label: 'Ciclo Médio',
      value:
        summary?.avgCycleDays != null ? `${summary.avgCycleDays}d` : '—',
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      iconBg: 'bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
