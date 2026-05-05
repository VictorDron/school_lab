import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  AdmissionGateApproval,
  PipelineStatus,
  GateStepConfig,
  AdmissionDepartment,
  GateApprovalDecision,
} from '@/types/contract';

export function useGateApprovals(leadId: string | null) {
  return useQuery({
    queryKey: ['gate-approvals', leadId],
    queryFn: () => get<AdmissionGateApproval[]>(`/gate-approvals/${leadId}`),
    enabled: !!leadId,
  });
}

export function usePipelineStatus(leadId: string | null) {
  return useQuery({
    queryKey: ['pipeline-status', leadId],
    queryFn: () => get<PipelineStatus>(`/gate-approvals/${leadId}/pipeline`),
    enabled: !!leadId,
  });
}

export function useGateConfig() {
  return useQuery({
    queryKey: ['gate-config'],
    queryFn: () => get<GateStepConfig[]>('/gate-approvals/config'),
  });
}

export function useSubmitApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      gateStep,
      department,
      decision,
      notes,
    }: {
      leadId: string;
      gateStep: string;
      department: AdmissionDepartment;
      decision: GateApprovalDecision;
      notes?: string;
    }) =>
      post<AdmissionGateApproval>(`/gate-approvals/${leadId}/${gateStep}`, {
        department,
        decision,
        notes,
      }),
    onSuccess: (_, variables) => {
      // Broad invalidation — gate changes can affect almost everything on the lead view
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['contract-prerequisites', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
      toast.success('Aprovação registrada com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useTransitionGate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, newStatus, notes }: { leadId: string; newStatus: string; notes?: string }) =>
      post(`/gate-approvals/${leadId}/transition`, { newStatus, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['contract-prerequisites', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
