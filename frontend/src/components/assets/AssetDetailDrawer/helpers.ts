import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Display formatters used by the drawer's tabs. All work in pt-BR locale.
// ---------------------------------------------------------------------------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
}

// ---------------------------------------------------------------------------
// Warranty window helpers — "expiring soon" is anything in the next 30 days.
// ---------------------------------------------------------------------------

const WARRANTY_EXPIRING_WINDOW_DAYS = 30;

export function isWarrantyExpiringSoon(warrantyDate: string): boolean {
  const warranty = new Date(warrantyDate);
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(now.getDate() + WARRANTY_EXPIRING_WINDOW_DAYS);
  return warranty <= cutoff && warranty >= now;
}

export function isWarrantyExpired(warrantyDate: string): boolean {
  return new Date(warrantyDate) < new Date();
}
