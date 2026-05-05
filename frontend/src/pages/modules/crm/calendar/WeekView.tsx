import { useMemo } from 'react';
import { EventChip } from './EventChip';
import type { CrmEvent } from '@/types/crm';

interface WeekViewProps {
  currentDate: Date;
  events: CrmEvent[];
  onTimeClick: (date: Date) => void;
  onEventClick: (eventId: string) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function WeekView({ currentDate, events, onTimeClick, onEventClick }: WeekViewProps) {
  const today = new Date();

  const weekDates = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const eventsByDateHour = useMemo(() => {
    const map = new Map<string, CrmEvent[]>();
    events.forEach((event) => {
      const d = new Date(event.startDate);
      const key = `${d.toDateString()}-${d.getHours()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[700px]">
        {/* Header with day labels */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 bg-white z-10 border-b border-neutral-200">
          <div className="border-r border-neutral-200" />
          {weekDates.map((date) => {
            const isToday = isSameDay(date, today);
            return (
              <div key={date.toISOString()} className="px-2 py-2 text-center border-r border-neutral-100">
                <div className="text-xs text-neutral-500">{weekDays[date.getDay()]}</div>
                <div
                  className={`text-sm font-medium mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#0aacce] text-white' : 'text-neutral-900'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-100">
            <div className="px-2 py-2 text-xs text-neutral-400 text-right pr-3 border-r border-neutral-200">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDates.map((date) => {
              const key = `${date.toDateString()}-${hour}`;
              const slotEvents = eventsByDateHour.get(key) || [];
              const slotDate = new Date(date);
              slotDate.setHours(hour, 0, 0, 0);

              return (
                <div
                  key={key}
                  className="min-h-[48px] p-0.5 border-r border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => onTimeClick(slotDate)}
                >
                  {slotEvents.map((event) => (
                    <EventChip key={event.id} event={event} onClick={onEventClick} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
