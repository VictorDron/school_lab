import type { PurchaseStatus } from '@/types/procurement';

interface PurchaseStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<PurchaseStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: {
    label: 'Rascunho',
    bg: 'bg-neutral-100',
    text: 'text-neutral-600',
    dot: 'bg-neutral-400',
  },
  PENDING_MANAGER: {
    label: 'Aguardando Gestor',
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    dot: 'bg-warning-400',
  },
  PENDING_FINANCE: {
    label: 'Aguardando Financeiro',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
  },
  APPROVED: {
    label: 'Aprovado',
    bg: 'bg-success-50',
    text: 'text-success-700',
    dot: 'bg-success-400',
  },
  REJECTED: {
    label: 'Rejeitado',
    bg: 'bg-error-50',
    text: 'text-error-700',
    dot: 'bg-error-400',
  },
  PURCHASED: {
    label: 'Comprado',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    dot: 'bg-primary-400',
  },
  CANCELLED: {
    label: 'Cancelado',
    bg: 'bg-neutral-200',
    text: 'text-neutral-700',
    dot: 'bg-neutral-500',
  },
};

const fallbackConfig = {
  label: 'Desconhecido',
  bg: 'bg-neutral-100',
  text: 'text-neutral-500',
  dot: 'bg-neutral-300',
};

export function PurchaseStatusBadge({ status, size = 'md' }: PurchaseStatusBadgeProps) {
  const config = statusConfig[status as PurchaseStatus] || fallbackConfig;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses}`}
    >
      <span className={`${dotSize} rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
