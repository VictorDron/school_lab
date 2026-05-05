import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/communication';

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const HOUR_START = 7;
const HOUR_END = 20;
const HOUR_HEIGHT = 60; // px per hour

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  MEETING: { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-800' },
  DEADLINE: { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-800' },
  REMINDER: { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-800' },
  CUSTOM: { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800' },
};

export default function WeekView({ events, currentDate, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i <= HOUR_END; i++) {
      h.push(i);
    }
    return h;
  }, []);

  const allDayEvents = useMemo(
    () => events.filter((e) => e.isAllDay),
    [events]
  );

  const timedEvents = useMemo(
    () => events.filter((e) => !e.isAllDay),
    [events]
  );

  function getEventsForDay(day: Date, list: CalendarEvent[]): CalendarEvent[] {
    return list.filter((event) => {
      const start = parseISO(event.startTime);
      return isSameDay(start, day);
    });
  }

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startHour = getHours(start) + getMinutes(start) / 60;
    const durationMinutes = differenceInMinutes(end, start);
    const top = (startHour - HOUR_START) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 20);
    return { top, height };
  }

  // Current time indicator
  const now = new Date();
  const currentTimeTop = (getHours(now) + getMinutes(now) / 60 - HOUR_START) * HOUR_HEIGHT;
  const showCurrentTime = getHours(now) >= HOUR_START && getHours(now) <= HOUR_END;

  return (
    <div className="flex-1 overflow-auto">
      {/* All-day events bar */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-2 py-1">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1">
            <div className="text-xs text-neutral-400 flex items-center justify-end pr-2">
              Dia todo
            </div>
            {days.map((day) => {
              const dayAllDay = getEventsForDay(day, allDayEvents);
              return (
                <div key={day.toISOString()} className="flex flex-col gap-0.5">
                  {dayAllDay.map((event) => {
                    const colors = typeColors[event.eventType] || typeColors.CUSTOM;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEventClick(event)}
                        className={`text-xs px-1.5 py-0.5 rounded truncate font-medium border-l-2 ${colors.bg} ${colors.border} ${colors.text} hover:opacity-80 transition-opacity text-left`}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header: day columns */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-neutral-200 sticky top-0 bg-white z-10">
        <div className="border-r border-neutral-100" />
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`py-2 text-center border-r border-neutral-100 ${today ? 'bg-primary-50' : ''}`}
            >
              <div className="text-xs text-neutral-500 uppercase">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div
                className={`text-lg font-semibold mt-0.5 ${
                  today ? 'text-primary-600' : 'text-neutral-900'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
        {/* Time labels column */}
        <div className="border-r border-neutral-100">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start justify-end pr-2 -mt-2"
            >
              <span className="text-xs text-neutral-400">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayTimedEvents = getEventsForDay(day, timedEvents);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className="border-r border-neutral-100 relative"
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-neutral-50"
                />
              ))}

              {/* Current time indicator */}
              {today && showCurrentTime && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: currentTimeTop }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                    <div className="flex-1 h-0.5 bg-red-500" />
                  </div>
                </div>
              )}

              {/* Event blocks */}
              {dayTimedEvents.map((event) => {
                const { top, height } = getEventPosition(event);
                const colors = typeColors[event.eventType] || typeColors.CUSTOM;
                const start = parseISO(event.startTime);

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick(event)}
                    className={`absolute left-0.5 right-0.5 rounded px-1.5 py-0.5 overflow-hidden border-l-2 cursor-pointer hover:opacity-80 transition-opacity text-left ${colors.bg} ${colors.border}`}
                    style={{ top, height, minHeight: 20 }}
                  >
                    <div className={`text-xs font-medium truncate ${colors.text}`}>
                      {event.title}
                    </div>
                    {height >= 36 && (
                      <div className="text-[10px] text-neutral-500 truncate">
                        {format(start, 'HH:mm')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
