import { useMemo } from 'react';
import { EventChip } from './EventChip';
import type { CrmEvent } from '@/types/crm';

interface DayViewProps {
  currentDate: Date;
  events: CrmEvent[];
  onTimeClick: (date: Date) => void;
  onEventClick: (eventId: string) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h

export function DayView({ currentDate, events, onTimeClick, onEventClick }: DayViewProps) {
  const eventsByHour = useMemo(() => {
    const map = new Map<number, CrmEvent[]>();
    events.forEach((event) => {
      const d = new Date(event.startDate);
      if (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === currentDate.getDate()
      ) {
        const hour = d.getHours();
        if (!map.has(hour)) map.set(hour, []);
        map.get(hour)!.push(event);
      }
    });
    return map;
  }, [events, currentDate]);

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[400px]">
        {HOURS.map((hour) => {
          const slotEvents = eventsByHour.get(hour) || [];
          const slotDate = new Date(currentDate);
          slotDate.setHours(hour, 0, 0, 0);

          return (
            <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-neutral-100">
              <div className="px-2 py-3 text-xs text-neutral-400 text-right pr-3 border-r border-neutral-200">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div
                className="min-h-[56px] p-1 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => onTimeClick(slotDate)}
              >
                <div className="space-y-1">
                  {slotEvents.map((event) => (
                    <EventChip key={event.id} event={event} onClick={onEventClick} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
