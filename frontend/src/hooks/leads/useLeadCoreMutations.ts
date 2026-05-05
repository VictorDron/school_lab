import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  Lead,
  CreateLeadData,
  UpdateLeadData,
} from '@/types/crm';
import { invalidateLeadRelated } from './useLeadDashboard';

// Create lead
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadData & { force?: boolean }) => post<Lead>('/leads', data),
    onSuccess: () => {
      toast.success('Lead criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
    onError: (error) => {
      // Don't show toast for duplicate email — the modal handles it
      if (axios.isAxiosError(error) && error.response?.status === 409) return;
      toast.error(getErrorMessage(error));
    },
  });
}

// Update lead
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadData }) =>
      patch<Lead>(`/leads/${id}`, data),
    onSuccess: (_, variables) => {
      toast.success('Lead atualizado com sucesso!');
      invalidateLeadRelated(queryClient, variables.id);
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete lead
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del(`/leads/${id}`),
    onSuccess: () => {
      toast.success('Lead deletado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update lead column (move in kanban)
export function useUpdateLeadColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, columnId }: { id: string; columnId: string }) =>
      patch<Lead>(`/leads/${id}/column`, { columnId }),
    onMutate: async ({ id, columnId }) => {
      await queryClient.cancelQueries({ queryKey: ['lead', id] });
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      const previousLead = queryClient.getQueryData(['lead', id]);
      const previousLeads = queryClient.getQueriesData({ queryKey: ['leads'] });

      queryClient.setQueryData(['lead', id], (old: { success: boolean; data: Lead } | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, columnId } };
      });

      queryClient.setQueriesData({ queryKey: ['leads'] }, (old: { success: boolean; data: Lead[] } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((lead) => lead.id === id ? { ...lead, columnId } : lead),
        };
      });

      return { previousLead, previousLeads };
    },
    onError: (error, variables, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(['lead', variables.id], context.previousLead);
      }
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(getErrorMessage(error));
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
  });
}

// Toggle lead flag with optimistic update for instant UI response
export function useToggleLeadFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patch<Lead>(`/leads/${id}/flag`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['lead', id] });
      await queryClient.cancelQueries({ queryKey: ['leads'] });

      const previousLead = queryClient.getQueryData(['lead', id]);
      const previousLeads = queryClient.getQueriesData({ queryKey: ['leads'] });

      queryClient.setQueryData(['lead', id], (old: { success: boolean; data: Lead } | undefined) => {
        if (!old?.data) return old;
        return { ...old, data: { ...old.data, isFlagged: !old.data.isFlagged } };
      });

      queryClient.setQueriesData({ queryKey: ['leads'] }, (old: { success: boolean; data: Lead[] } | undefined) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((lead) => lead.id === id ? { ...lead, isFlagged: !lead.isFlagged } : lead),
        };
      });

      return { previousLead, previousLeads };
    },
    onError: (error, id, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(['lead', id], context.previousLead);
      }
      if (context?.previousLeads) {
        context.previousLeads.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(getErrorMessage(error));
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
    },
  });
}
