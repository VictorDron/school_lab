import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalendarEvents } from '@/hooks/useCalendar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { CalendarEvent, CalendarViewMode } from '@/types/communication';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';

const VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
];

function getDateRange(
  viewMode: CalendarViewMode,
  currentDate: Date
): { startDate: string; endDate: string } {
  let start: Date;
  let end: Date;

  switch (viewMode) {
    case 'month': {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
      break;
    }
    case 'week': {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
      break;
    }
    case 'day': {
      start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      break;
    }
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

function getPeriodLabel(viewMode: CalendarViewMode, currentDate: Date): string {
  switch (viewMode) {
    case 'month':
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    case 'week': {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'd MMM', { locale: ptBR })} - ${format(end, "d MMM 'de' yyyy", { locale: ptBR })}`;
    }
    case 'day':
      return format(currentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
  }
}

export default function CalendarTab() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const { startDate, endDate } = useMemo(
    () => getDateRange(viewMode, currentDate),
    [viewMode, currentDate]
  );

  const { data: events = [], isLoading } = useCalendarEvents(startDate, endDate);

  const periodLabel = useMemo(
    () => getPeriodLabel(viewMode, currentDate),
    [viewMode, currentDate]
  );

  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case 'month': return subMonths(prev, 1);
        case 'week': return subWeeks(prev, 1);
        case 'day': return subDays(prev, 1);
      }
    });
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      switch (viewMode) {
        case 'month': return addMonths(prev, 1);
        case 'week': return addWeeks(prev, 1);
        case 'day': return addDays(prev, 1);
      }
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    setViewMode('day');
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  }, []);

  const handleNewEvent = useCallback(() => {
    setEditingEvent(undefined);
    setSelectedDate(currentDate);
    setModalOpen(true);
  }, [currentDate]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingEvent(undefined);
    setSelectedDate(undefined);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* View switcher */}
          <div className="flex bg-neutral-100 rounded-lg p-0.5">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setViewMode(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === opt.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={navigatePrev}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={navigateNext}
              className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Period display */}
          <h2 className="text-lg font-semibold text-neutral-900 capitalize">{periodLabel}</h2>
        </div>

        {/* New event button */}
        <button
          type="button"
          onClick={handleNewEvent}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <MonthView
                events={events}
                currentDate={currentDate}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                events={events}
                currentDate={currentDate}
                onEventClick={handleEventClick}
              />
            )}
            {viewMode === 'day' && (
              <DayView
                events={events}
                currentDate={currentDate}
                onEventClick={handleEventClick}
              />
            )}
          </>
        )}
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {modalOpen && (
          <EventModal
            event={editingEvent}
            defaultDate={selectedDate}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
