// ── Constants ─────────────────────────────────────────────────────────────────

export const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-success-100 text-success-700',
  IN_USE: 'bg-primary-100 text-primary-700',
  MAINTENANCE: 'bg-warning-100 text-warning-700',
  DECOMMISSIONED: 'bg-neutral-100 text-neutral-500',
};

export const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  MAINTENANCE: 'Manutenção',
  DECOMMISSIONED: 'Desativado',
};

export const purchaseStatusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING_MANAGER: 'Aguardando Gestor',
  PENDING_FINANCE: 'Aguardando Financeiro',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PURCHASED: 'Comprado',
  CANCELLED: 'Cancelado',
};

export const inventoryStatusColors: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  IN_PROGRESS: 'bg-warning-100 text-warning-700',
  COMPLETED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

export const inventoryStatusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
};

export const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ── Tab Content Animation ─────────────────────────────────────────────────────

export const tabVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
