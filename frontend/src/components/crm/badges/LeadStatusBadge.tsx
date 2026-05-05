import type { KanbanColumn } from '@/types/crm';

interface LeadStatusBadgeProps {
  column?: KanbanColumn | null;
  columnName?: string;
  columnColor?: string;
  size?: 'sm' | 'md';
}

export function LeadStatusBadge({ column, columnName, columnColor, size = 'sm' }: LeadStatusBadgeProps) {
  const name = column?.name || columnName || 'Desconhecido';
  const color = column?.color || columnColor || '#6B7280';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      <span
        className={`rounded-full ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
