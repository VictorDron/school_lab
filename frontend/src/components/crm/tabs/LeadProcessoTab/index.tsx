import { AlertTriangle } from 'lucide-react';
import { LeadPendenciesSection } from '../../LeadPendenciesSection';
import { AdmissionGateTracker } from '../../AdmissionGateTracker';
import { CreateEventModal } from '../../modals/CreateEventModal';
import { CreateEscalationModal } from '../../escalations/CreateEscalationModal';
import type { Lead } from '@/types/crm';
import { useLeadProcessoTab } from './useLeadProcessoTab';
import { NextStepBanner } from './NextStepBanner';
import { ProcessoEventsList } from './ProcessoEventsList';
import { ProcessoEvaluations } from './ProcessoEvaluations';

interface LeadProcessoTabProps {
  lead: Lead;
  onNavigateToCalendar?: (eventId?: string, eventDate?: Date) => void;
  onNavigateToContract?: () => void;
}

export function LeadProcessoTab({ lead, onNavigateToCalendar, onNavigateToContract }: LeadProcessoTabProps) {
  const { derived, ui, refs, setters, handlers, callbacks, loading } = useLeadProcessoTab({ lead });
  const { canEdit, userRole, gate, events, eventsLoading, evaluations } = derived;

  return (
    <div className="p-4 space-y-5">
      <NextStepBanner
        gate={gate}
        lead={lead}
        canEdit={canEdit}
        userRole={userRole}
        callbacks={callbacks}
        loading={loading}
      />

      <section>
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Jornada de Matrícula
        </h3>
        <AdmissionGateTracker status={gate} leadId={lead.id} defaultExpandCurrent />
      </section>

      {canEdit && (
        <button
          onClick={() => setters.setShowCreateEscalation(true)}
          className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Reportar Questão Crítica
        </button>
      )}

      {!['FORM_RECEIVED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED'].includes(gate) && (
        <LeadPendenciesSection leadId={lead.id} onNavigateToContract={onNavigateToContract} />
      )}

      <ProcessoEvaluations
        evaluations={evaluations}
        showEvalForm={ui.showEvalForm}
        evalEventId={ui.evalEventId}
        evalFormRef={refs.evalFormRef}
        leadId={lead.id}
        onCloseEvalForm={handlers.handleCloseEvalForm}
      />

      <ProcessoEventsList
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
