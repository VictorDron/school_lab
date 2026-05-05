import { Users, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import type { DashboardStats } from '@/types/re-enrollment';

interface PeriodSummaryCardsProps {
  stats: DashboardStats;
}

function getCountByStatus(statusCounts: DashboardStats['statusCounts'], ...statuses: string[]): number {
  return statusCounts
    .filter((s) => statuses.includes(s.status))
    .reduce((sum, s) => sum + s._count._all, 0);
}

export default function PeriodSummaryCards({ stats }: PeriodSummaryCardsProps) {
  const confirmed = getCountByStatus(stats.statusCounts, 'CONFIRMED');
  const pending = getCountByStatus(stats.statusCounts, 'SENT', 'OPENED', 'PENDING');
  const declined = getCountByStatus(stats.statusCounts, 'DECLINED');
  const expired = getCountByStatus(stats.statusCounts, 'EXPIRED');
  const total = stats.total;

  const cards = [
    {
      label: 'Total Convidados',
      value: total,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      barColor: 'bg-cyan-500',
      percent: 100,
    },
    {
      label: 'Confirmados',
      value: confirmed,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      barColor: 'bg-emerald-500',
      percent: total > 0 ? (confirmed / total) * 100 : 0,
    },
    {
      label: 'Pendentes',
      value: pending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      barColor: 'bg-amber-500',
      percent: total > 0 ? (pending / total) * 100 : 0,
    },
    {
      label: 'Recusados',
      value: declined,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      barColor: 'bg-red-500',
      percent: total > 0 ? (declined / total) * 100 : 0,
    },
    {
      label: 'Expirados',
      value: expired,
      icon: AlertTriangle,
      color: 'text-neutral-500',
      bg: 'bg-neutral-50',
      barColor: 'bg-neutral-400',
      percent: total > 0 ? (expired / total) * 100 : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <span className="text-xs font-medium text-neutral-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-2">{card.value}</div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${card.barColor} transition-all`}
                style={{ width: `${Math.min(card.percent, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">{card.percent.toFixed(1)}%</div>
          </div>
        );
      })}
    </div>
  );
}
