import { useMemo } from 'react';
import {
  format,
  getHours,
  getMinutes,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui/Avatar';
import type { CalendarEvent } from '@/types/communication';

interface DayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

const HOUR_START = 7;
const HOUR_END = 20;
const HOUR_HEIGHT = 80; // taller rows for more detail

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  MEETING: { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-800' },
  DEADLINE: { bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-800' },
  REMINDER: { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-800' },
  CUSTOM: { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800' },
};

export default function DayView({ events, currentDate, onEventClick }: DayViewProps) {
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = HOUR_START; i <= HOUR_END; i++) h.push(i);
    return h;
  }, []);

  const dayEvents = useMemo(
    () =>
      events.filter((e) => {
        const start = parseISO(e.startTime);
        return isSameDay(start, currentDate);
      }),
    [events, currentDate]
  );

  const allDayEvents = useMemo(
    () => dayEvents.filter((e) => e.isAllDay),
    [dayEvents]
  );

  const timedEvents = useMemo(
    () => dayEvents.filter((e) => !e.isAllDay),
    [dayEvents]
  );

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.startTime);
    const end = parseISO(event.endTime);
    const startHour = getHours(start) + getMinutes(start) / 60;
    const durationMinutes = differenceInMinutes(end, start);
    const top = (startHour - HOUR_START) * HOUR_HEIGHT;
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 32);
    return { top, height };
  }

  const now = new Date();
  const today = isToday(currentDate);
  const currentTimeTop = (getHours(now) + getMinutes(now) / 60 - HOUR_START) * HOUR_HEIGHT;
  const showCurrentTime = today && getHours(now) >= HOUR_START && getHours(now) <= HOUR_END;

  return (
    <div className="flex-1 overflow-auto">
      {/* Day header */}
      <div className="sticky top-0 bg-white z-10 border-b border-neutral-200 px-4 py-3">
        <h3 className="text-lg font-semibold text-neutral-900">
          {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h3>
      </div>

      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
          <div className="text-xs font-semibold text-neutral-500 mb-1 uppercase">Dia inteiro</div>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => {
              const colors = typeColors[event.eventType] || typeColors.CUSTOM;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className={`text-sm px-3 py-1.5 rounded-lg border-l-2 font-medium hover:opacity-80 transition-opacity ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  {event.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="grid grid-cols-[80px_1fr] relative">
        {/* Time labels */}
        <div className="border-r border-neutral-100">
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start justify-end pr-3 -mt-2"
            >
              <span className="text-xs text-neutral-400">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* Events column */}
        <div className="relative">
          {/* Hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: HOUR_HEIGHT }}
              className="border-b border-neutral-50"
            />
          ))}

          {/* Current time indicator */}
          {showCurrentTime && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: currentTimeTop }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}

          {/* Timed events */}
          {timedEvents.map((event) => {
            const { top, height } = getEventPosition(event);
            const colors = typeColors[event.eventType] || typeColors.CUSTOM;
            const start = parseISO(event.startTime);
            const end = parseISO(event.endTime);

            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className={`absolute left-1 right-4 rounded-lg px-3 py-2 overflow-hidden border-l-3 cursor-pointer hover:opacity-80 transition-opacity text-left ${colors.bg} ${colors.border}`}
                style={{ top, height, minHeight: 32 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${colors.text}`}>
                      {event.title}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                    </div>
                    {height >= 80 && event.description && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Participant avatars */}
                  {event.participants && event.participants.length > 0 && height >= 56 && (
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {event.participants.slice(0, 3).map((p) => (
                        <Avatar
                          key={p.id}
                          src={p.user.avatarUrl}
                          name={p.user.displayName}
                          size="xs"
                          className="ring-2 ring-white"
                        />
                      ))}
                      {event.participants.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-medium ring-2 ring-white">
                          +{event.participants.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
