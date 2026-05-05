import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { CalendarViewType } from './CalendarView';

interface CalendarHeaderProps {
  currentDate: Date;
  viewType: CalendarViewType;
  setViewType: (v: CalendarViewType) => void;
  onToday: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onNewEvent: () => void;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getTitle(date: Date, viewType: CalendarViewType) {
  if (viewType === 'month') {
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (viewType === 'week') {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = `${start.getDate()} ${months[start.getMonth()].slice(0, 3)}`;
    const endStr = `${end.getDate()} ${months[end.getMonth()].slice(0, 3)}`;
    return `${startStr} - ${endStr} ${end.getFullYear()}`;
  }
  return `${weekDays[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function CalendarHeader({
  currentDate,
  viewType,
  setViewType,
  onToday,
  onNavigate,
  onNewEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-200">
      <div className="flex items-center gap-3">
        <button onClick={onNewEvent} className="btn btn-primary btn-md">
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>

        <button
          onClick={onToday}
          className="px-3 py-1.5 text-sm font-medium border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Hoje
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(-1)}
            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <button
            onClick={() => onNavigate(1)}
            className="p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-neutral-900">
          {getTitle(currentDate, viewType)}
        </h2>
      </div>

      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
        {(['month', 'week', 'day'] as CalendarViewType[]).map((vt) => (
          <button
            key={vt}
            onClick={() => setViewType(vt)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewType === vt
                ? 'bg-white shadow-sm text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {vt === 'month' ? 'Mês' : vt === 'week' ? 'Semana' : 'Dia'}
          </button>
        ))}
      </div>
    </div>
  );
}
