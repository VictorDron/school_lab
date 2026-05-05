import { format, parseISO } from 'date-fns';
import type { StudentHistory } from '@/types/students';

interface EventTimelineProps {
  events: StudentHistory[];
}

const DOT_COLORS: Record<string, string> = {
  CREATED: 'bg-green-400',
  ENROLLED: 'bg-green-400',
  STATUS_CHANGED: 'bg-blue-400',
  UPDATED: 'bg-violet-400',
  FIELD_UPDATED: 'bg-violet-400',
  DOCUMENT_UPLOADED: 'bg-amber-400',
};

const ACTION_LABELS: Record<string, string> = {
  CREATED: 'Aluno criado',
  STATUS_CHANGED: 'Status alterado',
  UPDATED: 'Dados atualizados',
  FIELD_UPDATED: 'Campo atualizado',
  DOCUMENT_UPLOADED: 'Documento enviado',
  ENROLLED: 'Aluno matriculado',
};

function formatEventDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm');
  } catch {
    return iso;
  }
}

function renderDetails(action: string, details: Record<string, unknown> | null): string | null {
  if (!details) return null;

  if (action === 'STATUS_CHANGED' && details.from && details.to) {
    return `De ${details.from} para ${details.to}`;
  }

  if (action === 'FIELD_UPDATED' && details.field) {
    return `Campo: ${details.field}`;
  }

  return null;
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm italic text-neutral-400">Nenhum evento registrado</p>
    );
  }

  return (
    <div className="border-l-2 border-neutral-200 ml-2">
      {events.map((event) => {
        const dotColor = DOT_COLORS[event.action] ?? 'bg-neutral-300';
        const label = ACTION_LABELS[event.action] ?? event.action;
        const detailText = renderDetails(event.action, event.details);

        return (
          <div key={event.id} className="relative pl-6 pb-4">
            <div
              className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor}`}
            />
            <p className="text-xs text-neutral-400">
              {formatEventDate(event.createdAt)}
            </p>
            <p className="text-sm font-medium text-neutral-700">{label}</p>
            {detailText && (
              <p className="text-xs text-neutral-500 mt-0.5">{detailText}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
