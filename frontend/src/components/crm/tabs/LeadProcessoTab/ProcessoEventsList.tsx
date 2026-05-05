import { CalendarDays, Loader2, Plus } from 'lucide-react';
import type { CrmEvent } from '@/types/crm';
import { EventCard } from './EventCard';

interface ProcessoEventsListProps {
  events: CrmEvent[];
  eventsLoading: boolean;
  canEdit: boolean;
  onNavigateToCalendar?: (eventId?: string, eventDate?: Date) => void;
  onCreateEvent: () => void;
}

export function ProcessoEventsList({
  events,
  eventsLoading,
  canEdit,
  onNavigateToCalendar,
  onCreateEvent,
}: ProcessoEventsListProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Eventos ({events.length})
        </h3>
        <div className="flex items-center gap-3">
          {onNavigateToCalendar && (
            <button
              onClick={() => onNavigateToCalendar()}
              className="text-xs text-neutral-500 hover:text-[#0aacce] hover:underline flex items-center gap-1 transition-colors"
            >
              <CalendarDays className="w-3 h-3" />
              Calendário
            </button>
          )}
          {canEdit && (
            <button
              onClick={onCreateEvent}
              className="text-xs text-[#0aacce] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Novo
            </button>
          )}
        </div>
      </div>

      {eventsLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-6 text-sm text-neutral-400">
          Nenhum evento registrado
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canEdit={canEdit}
              onNavigateToCalendar={onNavigateToCalendar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
