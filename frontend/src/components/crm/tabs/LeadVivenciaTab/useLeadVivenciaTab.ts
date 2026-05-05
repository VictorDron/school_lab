import { useState } from 'react';
import type { Lead, AdmissionGateStatus } from '@/types/crm';
import { useLeadEvents, useApproveVisit, useRejectLead } from '@/hooks/useCrmEvents';
import { useLeadEvaluations } from '@/hooks/useEvaluations';
import { useAuthStore } from '@/stores/authStore';

export type CreateEventType = 'VISIT' | 'VIVENCIA';

export function useLeadVivenciaTab({ lead }: { lead: Lead }) {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [createEventType, setCreateEventType] = useState<CreateEventType>('VISIT');
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalEventId, setEvalEventId] = useState<string | null>(null);
  const [showCreateEscalation, setShowCreateEscalation] = useState(false);

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');

  const { data: eventsData, isLoading: eventsLoading } = useLeadEvents(lead.id);
  const { data: evalsData } = useLeadEvaluations(lead.id);
  const approveVisitMutation = useApproveVisit();
  const rejectLeadMutation = useRejectLead();

  const events = eventsData?.data || [];
  const evaluations = evalsData?.data || [];
  const gate = (lead.admissionGateStatus || 'NOT_STARTED') as AdmissionGateStatus;

  const latestVivencia = events.find(
    (e) => e.eventType === 'VIVENCIA' && e.vivenciaStatus === 'COMPLETED'
  );

  const onScheduleVisit = () => {
    setCreateEventType('VISIT');
    setShowCreateEvent(true);
  };

  const onScheduleVivencia = () => {
    setCreateEventType('VIVENCIA');
    setShowCreateEvent(true);
  };

  const onFillEvaluation = () => {
    if (latestVivencia) {
      setEvalEventId(latestVivencia.id);
      setShowEvalForm(true);
    }
  };

  const handleCloseEvalForm = () => {
    setShowEvalForm(false);
    setEvalEventId(null);
  };

  const onApproveVisit = () => approveVisitMutation.mutate(lead.id);
  const onRejectLead = () => rejectLeadMutation.mutate(lead.id);

  return {
    derived: {
      canEdit,
      gate,
      events,
      eventsLoading,
      evaluations,
      latestVivencia,
    },
    ui: {
      showCreateEvent,
      createEventType,
      showEvalForm,
      evalEventId,
      showCreateEscalation,
    },
    setters: {
      setShowCreateEvent,
      setShowCreateEscalation,
    },
    handlers: {
      handleCloseEvalForm,
    },
    callbacks: {
      onScheduleVisit,
      onScheduleVivencia,
      onFillEvaluation,
      onApproveVisit,
      onRejectLead,
    },
    loading: {
      approve: approveVisitMutation.isPending,
      reject: rejectLeadMutation.isPending,
    },
  };
}

export type LeadVivenciaCallbacks = ReturnType<typeof useLeadVivenciaTab>['callbacks'];
export type LeadVivenciaLoading = ReturnType<typeof useLeadVivenciaTab>['loading'];
