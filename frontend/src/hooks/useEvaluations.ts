import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { ExperienceEvaluation, EvaluationDecision } from '@/types/crm';

interface CreateEvaluationData {
  eventId: string;
  childId: string;
  leadId: string;
  teacherName: string;
  evaluationDate: string;
  behavior?: string;
  english?: string;
  interactionWithKids?: string;
  mathPlacement?: string;
  englishPlacement?: string;
  additionalNotes?: string;
}

interface UpdateEvaluationData {
  teacherName?: string;
  evaluationDate?: string;
  behavior?: string;
  english?: string;
  interactionWithKids?: string;
  mathPlacement?: string;
  englishPlacement?: string;
  additionalNotes?: string;
}

// By event
export function useEventEvaluations(eventId: string | null) {
  return useQuery({
    queryKey: ['evaluations', 'event', eventId],
    queryFn: () => get<ExperienceEvaluation[]>(`/evaluations/event/${eventId}`),
    enabled: !!eventId,
  });
}

// By lead
export function useLeadEvaluations(leadId: string | null) {
  return useQuery({
    queryKey: ['evaluations', 'lead', leadId],
    queryFn: () => get<ExperienceEvaluation[]>(`/evaluations/lead/${leadId}`),
    enabled: !!leadId,
  });
}

// Single evaluation
export function useEvaluation(id: string | null) {
  return useQuery({
    queryKey: ['evaluation', id],
    queryFn: () => get<ExperienceEvaluation>(`/evaluations/${id}`),
    enabled: !!id,
  });
}

// Create
export function useCreateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEvaluationData) => post<ExperienceEvaluation>('/evaluations', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['crm-event'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      toast.success('Avaliação criada com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update
export function useUpdateEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId, data }: { id: string; leadId?: string; data: UpdateEvaluationData }) =>
      patch<ExperienceEvaluation>(`/evaluations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation', variables.id] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      }
      toast.success('Avaliação atualizada');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Decision (approve/reject)
export function useEvaluationDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId, decision, notes }: { id: string; leadId?: string; decision: EvaluationDecision; notes?: string }) =>
      patch<ExperienceEvaluation>(`/evaluations/${id}/decision`, { decision, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      }
      const msg = variables.decision === 'APPROVED' ? 'Avaliação aprovada' : 'Avaliação rejeitada';
      toast.success(msg);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
