import { useMemo } from 'react';
import { EventChip } from './EventChip';
import type { CrmEvent } from '@/types/crm';

interface MonthViewProps {
  currentDate: Date;
  events: CrmEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (eventId: string) => void;
  onDayClick: (date: Date) => void;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function MonthView({ currentDate, events, onDateClick, onEventClick, onDayClick }: MonthViewProps) {
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weeks = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const result: Date[][] = [];
    const current = new Date(startDate);

    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      result.push(week);
      // Stop if we've gone past the month and completed the week
      if (current.getMonth() !== month && current.getDay() === 0) break;
    }
    return result;
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CrmEvent[]>();
    events.forEach((event) => {
      const key = new Date(event.startDate).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);

  return (
    <div className="h-full flex flex-col">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
        {weekDays.map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium text-neutral-500 uppercase">
            {day}
          </div>
        ))}
      </div>

      {/* Weeks grid */}
      <div className="flex-1 grid" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-neutral-100">
            {week.map((date) => {
              const isCurrentMonth = date.getMonth() === month;
              const isToday = isSameDay(date, today);
              const dayEvents = eventsByDate.get(date.toDateString()) || [];

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[80px] p-1 border-r border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors ${
                    !isCurrentMonth ? 'bg-neutral-50/50' : ''
                  }`}
                  onClick={() => onDateClick(date)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayClick(date);
                    }}
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full mb-0.5 ${
                      isToday
                        ? 'bg-[#0aacce] text-white font-bold'
                        : isCurrentMonth
                          ? 'text-neutral-900 hover:bg-neutral-200'
                          : 'text-neutral-400'
                    }`}
                  >
                    {date.getDate()}
                  </button>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventChip key={event.id} event={event} onClick={onEventClick} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-neutral-500 pl-1">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
