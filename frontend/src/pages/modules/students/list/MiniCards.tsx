import { Users, UserCheck, UserPlus, AlertTriangle } from 'lucide-react';

interface MiniCardsProps {
  total: number;
  activeCount: number;
  newThisMonth: number;
  withAlerts: number;
}

const cards = [
  {
    key: 'total',
    label: 'Total de Alunos',
    icon: Users,
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    prop: 'total' as const,
  },
  {
    key: 'active',
    label: 'Ativos',
    icon: UserCheck,
    bg: 'bg-green-50',
    text: 'text-green-700',
    prop: 'activeCount' as const,
  },
  {
    key: 'new',
    label: 'Novos Este Mês',
    icon: UserPlus,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    prop: 'newThisMonth' as const,
  },
  {
    key: 'alerts',
    label: 'Com Pendências',
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    prop: 'withAlerts' as const,
  },
];

export function MiniCards({ total, activeCount, newThisMonth, withAlerts }: MiniCardsProps) {
  const values = { total, activeCount, newThisMonth, withAlerts };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={`${card.bg} rounded-xl p-3 flex flex-col gap-1`}
          >
            <Icon className={`w-4 h-4 ${card.text}`} />
            <span className={`text-xl font-bold ${card.text}`}>
              {values[card.prop]}
            </span>
            <span className="text-xs text-neutral-500">{card.label}</span>
          </div>
        );
      })}
    </div>
  );
}
