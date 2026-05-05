import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  CriticalIssueEscalation,
  AdmissionDepartment,
  EscalationSeverity,
} from '@/types/contract';

export function useActiveEscalations() {
  return useQuery({
    queryKey: ['escalations'],
    queryFn: () => get<CriticalIssueEscalation[]>('/escalations'),
  });
}

export function useLeadEscalations(leadId: string | null) {
  return useQuery({
    queryKey: ['escalations', 'lead', leadId],
    queryFn: () => get<CriticalIssueEscalation[]>(`/escalations/lead/${leadId}`),
    enabled: !!leadId,
  });
}

export function useCreateEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      leadId: string;
      childId?: string;
      department: AdmissionDepartment;
      gateStep: string;
      description: string;
      severity: EscalationSeverity;
    }) => post<CriticalIssueEscalation>('/escalations', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      toast.success('Escalação criada com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId, notes }: { id: string; leadId?: string; notes: string }) =>
      patch<CriticalIssueEscalation>(`/escalations/${id}/resolve`, { notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Escalação resolvida');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
