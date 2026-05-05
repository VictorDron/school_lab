import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  parseISO,
} from 'date-fns';
import type { CalendarEvent } from '@/types/communication';
import EventChip from './EventChip';

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function MonthView({ events, currentDate, onDateClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((event) => {
      const start = parseISO(event.startTime);
      const end = parseISO(event.endTime);
      return (
        isSameDay(start, day) ||
        isSameDay(end, day) ||
        (day >= start && day <= end)
      );
    });
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-neutral-200">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const maxVisible = 3;
          const overflow = dayEvents.length - maxVisible;

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateClick(day)}
              className={`min-h-[100px] border-b border-r border-neutral-100 p-1 cursor-pointer transition-colors hover:bg-neutral-50 ${
                !inCurrentMonth ? 'bg-neutral-50/50' : ''
              }`}
            >
              {/* Day number */}
              <div className="flex items-center justify-center mb-1">
                <span
                  className={`text-sm w-7 h-7 flex items-center justify-center rounded-full ${
                    today
                      ? 'bg-primary-600 text-white font-bold'
                      : inCurrentMonth
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-300'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event chips */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    type="button"
                    className="text-xs text-neutral-500 hover:text-primary-600 font-medium pl-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(day);
                    }}
                  >
                    +{overflow} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
