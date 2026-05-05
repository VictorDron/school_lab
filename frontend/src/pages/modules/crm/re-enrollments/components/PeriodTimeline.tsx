import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useReEnrollmentTimeline } from '@/hooks/useReEnrollmentDashboard';

interface PeriodTimelineProps {
  periodId: string;
}

const MILESTONE_LABELS: Record<string, string> = {
  opened: 'Campanha Aberta',
  first_invite: 'Primeiro Convite Enviado',
  first_confirmation: 'Primeira Confirmação',
  reminders_sent: 'Lembretes Enviados',
  closed: 'Campanha Encerrada',
  finalized: 'Campanha Finalizada',
};

function getDotColor(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'bg-blue-500 ring-2 ring-blue-200';
  if (isPast(date)) return 'bg-emerald-500';
  return 'bg-neutral-300';
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export default function PeriodTimeline({ periodId }: PeriodTimelineProps) {
  const { data, isLoading } = useReEnrollmentTimeline(periodId);
  const raw = data?.data as unknown;
  const milestones: Array<{ type: string; date: string; label?: string }> =
    Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'milestones' in raw ? (raw as any).milestones : []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="text-center py-6 text-neutral-400 text-xs">
        Nenhum marco registrado ainda.
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neutral-200" />

      {milestones.map((milestone, index) => (
        <div key={index} className="relative flex items-start gap-3 pb-5 last:pb-0">
          <div className={`absolute left-[-13px] top-1.5 w-3 h-3 rounded-full ${getDotColor(milestone.date)}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800 leading-tight">
              {MILESTONE_LABELS[milestone.type] || milestone.label || milestone.type}
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {formatDate(milestone.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
