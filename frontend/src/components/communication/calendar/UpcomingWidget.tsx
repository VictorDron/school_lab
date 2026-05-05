import { motion } from 'framer-motion';
import { Calendar, Clock, Flag, Bell, Star } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUpcomingEvents } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/types/communication';

const typeIcons: Record<string, typeof Calendar> = {
  MEETING: Calendar,
  DEADLINE: Flag,
  REMINDER: Bell,
  CUSTOM: Star,
};

const typeColors: Record<string, string> = {
  MEETING: 'text-blue-600 bg-blue-100',
  DEADLINE: 'text-red-600 bg-red-100',
  REMINDER: 'text-amber-600 bg-amber-100',
  CUSTOM: 'text-purple-600 bg-purple-100',
};

function formatEventDate(event: CalendarEvent): string {
  const date = parseISO(event.startTime);
  if (isToday(date)) {
    return event.isAllDay ? 'Hoje' : `Hoje, ${format(date, 'HH:mm')}`;
  }
  if (isTomorrow(date)) {
    return event.isAllDay ? 'Amanha' : `Amanha, ${format(date, 'HH:mm')}`;
  }
  if (event.isAllDay) {
    return format(date, "d 'de' MMM", { locale: ptBR });
  }
  return format(date, "d 'de' MMM, HH:mm", { locale: ptBR });
}

export default function UpcomingWidget() {
  const { data: events, isLoading } = useUpcomingEvents(4);

  if (isLoading) {
    return (
      <div className="divide-y divide-neutral-50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-neutral-200" />
            <div className="flex-1">
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-neutral-400">
        <Calendar className="w-8 h-8 mx-auto mb-1.5" />
        <p className="text-xs">Nenhum evento proximo</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-50">
      {events.map((event, index) => {
        const Icon = typeIcons[event.eventType] || Calendar;
        const colorClass = typeColors[event.eventType] || 'text-neutral-600 bg-neutral-100';

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 py-2.5 hover:bg-neutral-50/50 transition-colors cursor-pointer"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {event.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Clock className="w-3 h-3" />
                <span>{formatEventDate(event)}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
