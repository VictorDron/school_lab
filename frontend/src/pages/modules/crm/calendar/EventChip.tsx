import type { CrmEvent } from '@/types/crm';

interface EventChipProps {
  event: CrmEvent;
  onClick: (eventId: string) => void;
  compact?: boolean;
}

const eventStyles = {
  VISIT: 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-150',
  VIVENCIA: 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-150',
};

export function EventChip({ event, onClick, compact = false }: EventChipProps) {
  const time = new Date(event.startDate).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event.id);
      }}
      className={`w-full text-left px-1.5 py-0.5 rounded border text-xs font-medium truncate transition-colors ${
        eventStyles[event.eventType]
      }`}
      title={`${event.title} - ${time}`}
    >
      {compact ? (
        <span className="truncate">{event.title}</span>
      ) : (
        <span className="truncate">
          {time} {event.title}
        </span>
      )}
    </button>
  );
}
