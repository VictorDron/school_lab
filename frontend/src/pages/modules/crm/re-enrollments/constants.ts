import type {
  ReEnrollmentPeriodStatus,
  DashboardStats,
} from '@/types/re-enrollment';

export const STATUS_LABELS: Record<ReEnrollmentPeriodStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberto',
  CLOSED: 'Fechado',
  FINALIZED: 'Finalizado',
};

export const STATUS_COLORS: Record<ReEnrollmentPeriodStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  OPEN: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-amber-100 text-amber-700',
  FINALIZED: 'bg-purple-100 text-purple-700',
};

export const ACCENT_GRADIENTS: Record<ReEnrollmentPeriodStatus, string> = {
  DRAFT: 'from-neutral-300 to-neutral-400',
  OPEN: 'from-cyan-500 to-teal-500',
  CLOSED: 'from-amber-400 to-orange-400',
  FINALIZED: 'from-purple-400 to-indigo-400',
};

export const NEXT_TRANSITION: Partial<
  Record<ReEnrollmentPeriodStatus, { label: string; next: ReEnrollmentPeriodStatus }>
> = {
  DRAFT: { label: 'Abrir Campanha', next: 'OPEN' },
  OPEN: { label: 'Fechar Campanha', next: 'CLOSED' },
  CLOSED: { label: 'Finalizar Campanha', next: 'FINALIZED' },
};

export const INVITE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  SENT: 'Enviado',
  OPENED: 'Aberto',
  CONFIRMED: 'Confirmado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  DECLINED: 'Recusado',
};

export const GATE_STATUS_LABELS: Record<string, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Docs Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Entrada Paga',
  REMATRICULADO: 'Rematriculado',
};

export const INVITE_FILTER_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'OPENED', label: 'Aberto' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export const UNIFIED_FILTER_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'AWAITING', label: 'Aguardando Envio' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'OPENED', label: 'Aberto' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'DECLINED', label: 'Recusado' },
];

export const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CARTAO', label: 'Cartão' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
];

export function getCountByStatus(
  statusCounts: DashboardStats['statusCounts'],
  ...statuses: string[]
): number {
  return statusCounts
    .filter((s) => statuses.includes(s.status))
    .reduce((sum, s) => sum + s._count._all, 0);
}
