import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { Lead, AdmissionGateStatus } from '@/types/crm';
import type { AdmissionDepartment } from '@/types/contract';
import { useLeadEvents, useApproveVisit, useRejectLead } from '@/hooks/useCrmEvents';
import { useLeadEvaluations } from '@/hooks/useEvaluations';
import { useGenerateApplicationLink, useSendApplicationLinkEmail } from '@/hooks/useLeads';
import { useTransitionGate, useSubmitApproval } from '@/hooks/useGateApprovals';
import { useAuthStore } from '@/stores/authStore';
import { buildApplicationLink } from './helpers';

export type CreateEventType = 'VISIT' | 'VIVENCIA';

export function useLeadProcessoTab({ lead }: { lead: Lead }) {
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [createEventType, setCreateEventType] = useState<CreateEventType>('VISIT');
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalEventId, setEvalEventId] = useState<string | null>(null);
  const [showCreateEscalation, setShowCreateEscalation] = useState(false);
  const evalFormRef = useRef<HTMLDivElement>(null);

  const { hasModuleAccess, user } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const userRole = user?.role || '';

  const { data: eventsData, isLoading: eventsLoading } = useLeadEvents(lead.id);
  const { data: evalsData } = useLeadEvaluations(lead.id);
  const approveVisitMutation = useApproveVisit();
  const rejectLeadMutation = useRejectLead();
  const generateLinkMutation = useGenerateApplicationLink();
  const sendEmailMutation = useSendApplicationLinkEmail();
  const transitionGateMutation = useTransitionGate();
  const submitApprovalMutation = useSubmitApproval();

  const events = eventsData?.data || [];
  const evaluations = evalsData?.data || [];
  const gate = (lead.admissionGateStatus || 'NOT_STARTED') as AdmissionGateStatus;

  const latestVivencia = events.find(
    (e) => e.eventType === 'VIVENCIA' && e.vivenciaStatus === 'COMPLETED'
  );

  const applicationLink = buildApplicationLink(lead.applicationToken);

  useEffect(() => {
    if (showEvalForm && evalFormRef.current) {
      evalFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showEvalForm]);

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

  const onCopyLink = () => {
    if (applicationLink) {
      navigator.clipboard.writeText(applicationLink);
      toast.success('Link de inscrição copiado!');
    }
  };

  const handleCloseEvalForm = () => {
    setShowEvalForm(false);
    setEvalEventId(null);
  };

  const onApproveVisit = () => approveVisitMutation.mutate(lead.id);
  const onRejectLead = () => rejectLeadMutation.mutate(lead.id);
  const onGenerateLink = () => generateLinkMutation.mutate(lead.id);
  const onSendLinkEmail = () => sendEmailMutation.mutate(lead.id);
  const onTransitionGate = (newStatus: string) =>
    transitionGateMutation.mutate({ leadId: lead.id, newStatus });
  const onDeptApprove = (gateStep: string, department: string) =>
    submitApprovalMutation.mutate({
      leadId: lead.id,
      gateStep,
      department: department as AdmissionDepartment,
      decision: 'APPROVED',
    });
  const onDeptReject = (gateStep: string, department: string) =>
    submitApprovalMutation.mutate({
      leadId: lead.id,
      gateStep,
      department: department as AdmissionDepartment,
      decision: 'REJECTED',
    });

  return {
    derived: {
      canEdit,
      userRole,
      gate,
      applicationLink,
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
    refs: {
      evalFormRef,
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
      onCopyLink,
      onApproveVisit,
      onRejectLead,
      onGenerateLink,
      onSendLinkEmail,
      onTransitionGate,
      onDeptApprove,
      onDeptReject,
    },
    loading: {
      generateLink: generateLinkMutation.isPending,
      sendEmail: sendEmailMutation.isPending,
      approve: approveVisitMutation.isPending,
      reject: rejectLeadMutation.isPending,
      transition: transitionGateMutation.isPending,
      deptApproval: submitApprovalMutation.isPending,
    },
  };
}

export type LeadProcessoCallbacks = ReturnType<typeof useLeadProcessoTab>['callbacks'];
export type LeadProcessoLoading = ReturnType<typeof useLeadProcessoTab>['loading'];
