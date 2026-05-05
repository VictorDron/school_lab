import type { ElementType } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export interface EventStatusConfig {
  label: string;
  icon: ElementType;
  className: string;
}

export const statusConfig: Record<string, EventStatusConfig> = {
  SCHEDULED: { label: 'Agendado', icon: Clock, className: 'text-yellow-700 bg-yellow-50' },
  IN_PROGRESS: { label: 'Em andamento', icon: Clock, className: 'text-blue-700 bg-blue-50' },
  COMPLETED: { label: 'Concluído', icon: CheckCircle, className: 'text-green-700 bg-green-50' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, className: 'text-red-700 bg-red-50' },
  NO_SHOW: { label: 'Não compareceu', icon: XCircle, className: 'text-neutral-700 bg-neutral-50' },
};
