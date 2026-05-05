import type { CalendarEvent } from '@/types/communication';
import { format, parseISO } from 'date-fns';

interface EventChipProps {
  event: CalendarEvent;
  onClick: () => void;
}

const typeStyles: Record<string, string> = {
  MEETING: 'bg-blue-100 text-blue-700',
  DEADLINE: 'bg-red-100 text-red-700',
  REMINDER: 'bg-amber-100 text-amber-700',
  CUSTOM: 'bg-purple-100 text-purple-700',
};

export default function EventChip({ event, onClick }: EventChipProps) {
  const colorClass = typeStyles[event.eventType] || 'bg-neutral-100 text-neutral-700';
  const startTime = parseISO(event.startTime);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
      style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : undefined}
    >
      {!event.isAllDay && (
        <span className="mr-1">{format(startTime, 'HH:mm')}</span>
      )}
      <span>{event.title}</span>
    </button>
  );
}
