import { Users, CheckCircle, XCircle, ArrowRightCircle, GraduationCap } from 'lucide-react';
import type { StudentDashboardStats } from '@/types/students';

interface StudentSummaryCardsProps {
  stats: StudentDashboardStats;
}

interface CardConfig {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function MetricCard({ label, value, icon, color, bgColor }: CardConfig) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${bgColor}`}>{icon}</div>
        <div className="min-w-0">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-neutral-500 font-medium truncate">{label}</p>
        </div>
      </div>
    </div>
  );
}

function getCountByStatus(byStatus: StudentDashboardStats['byStatus'], status: string): number {
  return byStatus.find((s) => s.status === status)?._count.id ?? 0;
}

export function StudentSummaryCards({ stats }: StudentSummaryCardsProps) {
  const cards: CardConfig[] = [
    {
      label: 'Total de Alunos',
      value: stats.total,
      icon: <Users className="w-4 h-4 text-violet-600" />,
      color: 'text-neutral-900',
      bgColor: 'bg-violet-50',
    },
    {
      label: 'Ativos',
      value: getCountByStatus(stats.byStatus, 'ACTIVE'),
      icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Inativos',
      value: getCountByStatus(stats.byStatus, 'INACTIVE'),
      icon: <XCircle className="w-4 h-4 text-neutral-500" />,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-100',
    },
    {
      label: 'Transferidos',
      value: getCountByStatus(stats.byStatus, 'TRANSFERRED'),
      icon: <ArrowRightCircle className="w-4 h-4 text-blue-600" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Graduados',
      value: getCountByStatus(stats.byStatus, 'GRADUATED'),
      icon: <GraduationCap className="w-4 h-4 text-purple-600" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
