import { useState, useMemo, useEffect } from 'react';
import { useCrmEvents } from '@/hooks/useCrmEvents';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CreateEventModal } from '@/components/crm/modals/CreateEventModal';
import { EventDetailDrawer } from '@/components/crm/drawers/EventDetailDrawer';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { CrmEventType } from '@/types/crm';

export type CalendarViewType = 'month' | 'week' | 'day';

interface CalendarViewProps {
  /** If provided, navigate to this date and open the event detail drawer */
  initialEventId?: string | null;
  initialDate?: Date | null;
  /** Called after the initial event has been consumed (so parent can clear it) */
  onInitialEventConsumed?: () => void;
}

export function CalendarView({ initialEventId, initialDate, onInitialEventConsumed }: CalendarViewProps = {}) {
  const [currentDate, setCurrentDate] = useState(initialDate ?? new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialEventId ?? null);
  const [isDetailOpen, setIsDetailOpen] = useState(!!initialEventId);
  const [createDefaults, setCreateDefaults] = useState<{ startDate?: Date } | null>(null);

  // React to new initialEventId from parent (e.g. navigating from LeadDrawer)
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
      setIsDetailOpen(true);
      if (initialDate) {
        setCurrentDate(initialDate);
      }
      onInitialEventConsumed?.();
    }
  }, [initialEventId]);

  // Calculate date range for fetching
  const dateRange = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (viewType === 'month') {
      const start = new Date(year, month, 1);
      start.setDate(start.getDate() - start.getDay()); // Go to Sunday
      const end = new Date(year, month + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay())); // Go to Saturday
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else if (viewType === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    } else {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
  }, [currentDate, viewType]);

  const { data: eventsData, isLoading } = useCrmEvents(dateRange);
  const events = eventsData?.data || [];

  const handleToday = () => setCurrentDate(new Date());

  const handleNavigate = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setCreateDefaults({ startDate: date });
    setIsCreateOpen(true);
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setIsDetailOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setViewType('day');
  };

  return (
    <div className="h-full flex flex-col">
      <CalendarHeader
        currentDate={currentDate}
        viewType={viewType}
        setViewType={setViewType}
        onToday={handleToday}
        onNavigate={handleNavigate}
        onNewEvent={() => setIsCreateOpen(true)}
      />

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewType === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDayClick={handleDayClick}
          />
        ) : viewType === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            onTimeClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
            onTimeClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateDefaults(null);
        }}
        defaultStartDate={createDefaults?.startDate}
      />

      <EventDetailDrawer
        eventId={selectedEventId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEventId(null);
        }}
      />
    </div>
  );
}
