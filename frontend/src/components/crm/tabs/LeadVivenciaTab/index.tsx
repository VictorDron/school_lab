import { AlertTriangle } from 'lucide-react';
import { AdmissionGateTracker } from '../../AdmissionGateTracker';
import { CreateEventModal } from '../../modals/CreateEventModal';
import { CreateEscalationModal } from '../../escalations/CreateEscalationModal';
import type { Lead } from '@/types/crm';
import { useLeadVivenciaTab } from './useLeadVivenciaTab';
import { NextStepBanner } from './NextStepBanner';
import { VivenciaEventsList } from './VivenciaEventsList';
import { VivenciaEvaluations } from './VivenciaEvaluations';

interface LeadVivenciaTabProps {
  lead: Lead;
  onNavigateToCalendar?: (eventId?: string, eventDate?: Date) => void;
}

// ────────────────────────────────────────────────────────────────
// Main Tab
// ────────────────────────────────────────────────────────────────
export function LeadVivenciaTab({ lead, onNavigateToCalendar }: LeadVivenciaTabProps) {
  const { derived, ui, setters, handlers, callbacks, loading } = useLeadVivenciaTab({ lead });
  const { canEdit, gate, events, eventsLoading, evaluations } = derived;

  return (
    <div className="p-4 space-y-4">
      {/* Gate Tracker */}
      <section className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Progresso da Admissão
          </h3>
          {canEdit && (
            <button
              onClick={() => setters.setShowCreateEscalation(true)}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Reportar Questão Crítica
            </button>
          )}
        </div>
        <AdmissionGateTracker status={gate} leadId={lead.id} />
      </section>

      {/* Next Step Banner — THE key UX element */}
      <NextStepBanner
        gate={gate}
        lead={lead}
        canEdit={canEdit}
        callbacks={callbacks}
        loading={loading}
      />

      <VivenciaEvaluations
        evaluations={evaluations}
        showEvalForm={ui.showEvalForm}
        evalEventId={ui.evalEventId}
        leadId={lead.id}
        onCloseEvalForm={handlers.handleCloseEvalForm}
      />

      <VivenciaEventsList
        events={events}
        eventsLoading={eventsLoading}
        canEdit={canEdit}
        onNavigateToCalendar={onNavigateToCalendar}
        onCreateEvent={() => setters.setShowCreateEvent(true)}
      />

      <CreateEventModal
        isOpen={ui.showCreateEvent}
        onClose={() => setters.setShowCreateEvent(false)}
        defaultLeadId={lead.id}
        defaultEventType={ui.createEventType}
      />

      {lead && (
        <CreateEscalationModal
          isOpen={ui.showCreateEscalation}
          onClose={() => setters.setShowCreateEscalation(false)}
          leadId={lead.id}
          leadName={lead.familyName}
        />
      )}
    </div>
  );
}
