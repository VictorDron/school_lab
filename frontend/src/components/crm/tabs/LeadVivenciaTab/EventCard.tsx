import {
  Eye,
  GraduationCap,
  CalendarDays,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { CrmEvent } from '@/types/crm';
import { useUpdateEventStatus } from '@/hooks/useCrmEvents';
import { statusConfig } from './helpers';

interface EventCardProps {
  event: CrmEvent;
  canEdit: boolean;
  onNavigateToCalendar?: (eventId?: string, eventDate?: Date) => void;
}

export function EventCard({ event, canEdit, onNavigateToCalendar }: EventCardProps) {
  const s = event.eventType === 'VISIT' ? event.visitStatus : event.vivenciaStatus;
  const config = statusConfig[s || 'SCHEDULED'];
  const isScheduled = s === 'SCHEDULED';
  const updateStatusMutation = useUpdateEventStatus();

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Event info row */}
      <div
        className={`flex items-start gap-3 p-3 ${
          onNavigateToCalendar ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''
        }`}
        onClick={onNavigateToCalendar ? () => onNavigateToCalendar(event.id, new Date(event.startDate)) : undefined}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            event.eventType === 'VISIT' ? 'bg-blue-100' : 'bg-purple-100'
          }`}
        >
          {event.eventType === 'VISIT' ? (
            <Eye className="w-4 h-4 text-blue-600" />
          ) : (
            <GraduationCap className="w-4 h-4 text-purple-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate capitalize">{event.title}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config?.className}`}>
              {config?.label}
            </span>
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {new Date(event.startDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}{' '}
            às{' '}
            {new Date(event.startDate).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {event.location && ` • ${event.location}`}
          </div>
          {event.assignedTeacher && (
            <div className="text-xs text-neutral-400 mt-0.5">
              Professor: {event.assignedTeacher.displayName}
            </div>
          )}
        </div>
        {onNavigateToCalendar && (
          <CalendarDays className="w-4 h-4 text-neutral-300 flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Inline actions for SCHEDULED events */}
      {canEdit && isScheduled && (
        <div className="flex border-t border-neutral-100">
          <button
            onClick={() => updateStatusMutation.mutate({ id: event.id, leadId: event.leadId, status: 'COMPLETED' })}
            disabled={updateStatusMutation.isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Marcar como Realizado
              </>
            )}
          </button>
          <div className="w-px bg-neutral-100" />
          <button
            onClick={() => updateStatusMutation.mutate({ id: event.id, leadId: event.leadId, status: 'CANCELLED' })}
            disabled={updateStatusMutation.isPending}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
