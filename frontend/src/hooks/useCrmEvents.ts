import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { CrmEvent, CrmEventType } from '@/types/crm';

export function isConflictError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}

export function getConflicts(error: unknown): any[] {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.conflicts || [];
  }
  return [];
}

interface EventFilters {
  startDate?: string;
  endDate?: string;
  eventType?: CrmEventType;
  leadId?: string;
}

interface CreateEventData {
  leadId: string;
  eventType: CrmEventType;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  color?: string;
  assignedTeacherId?: string;
  force?: boolean;
}

interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  color?: string;
  assignedTeacherId?: string | null;
  force?: boolean;
}

// List events with filters (for calendar)
export function useCrmEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ['crm-events', filters],
    queryFn: () =>
      get<CrmEvent[]>('/crm-events', {
        params: {
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          eventType: filters.eventType || undefined,
          leadId: filters.leadId || undefined,
        },
      }),
  });
}

// Get single event with evaluations
export function useCrmEvent(id: string | null) {
  return useQuery({
    queryKey: ['crm-event', id],
    queryFn: () => get<CrmEvent>(`/crm-events/${id}`),
    enabled: !!id,
  });
}

// Events by lead
export function useLeadEvents(leadId: string | null) {
  return useQuery({
    queryKey: ['crm-events', 'lead', leadId],
    queryFn: () => get<CrmEvent[]>(`/crm-events/lead/${leadId}`),
    enabled: !!leadId,
  });
}

// Create event
export function useCreateCrmEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventData) => post<CrmEvent>('/crm-events', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
      toast.success('Evento criado com sucesso');
    },
    onError: (error) => {
      // Don't show generic toast for conflicts — component handles it
      if (!isConflictError(error)) {
        toast.error(getErrorMessage(error));
      }
    },
  });
}

// Update event
export function useUpdateCrmEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId, data }: { id: string; leadId?: string; data: UpdateEventData }) =>
      patch<CrmEvent>(`/crm-events/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['crm-event', variables.id] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Evento atualizado com sucesso');
    },
    onError: (error) => {
      if (!isConflictError(error)) {
        toast.error(getErrorMessage(error));
      }
    },
  });
}

// Delete event
export function useDeleteCrmEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId }: { id: string; leadId?: string }) => del(`/crm-events/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Evento deletado com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update event status (complete, cancel, no-show)
export function useUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, leadId, status, notes }: { id: string; leadId?: string; status: string; notes?: string }) =>
      patch<CrmEvent>(`/crm-events/${id}/status`, { status, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['crm-event', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
      if (variables.leadId) {
        queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['gate-approvals', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['pipeline-status', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['contracts', variables.leadId] });
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status do evento atualizado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Approve visit
export function useApproveVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => post('/crm-events/approve-visit', { leadId }),
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-events'] });
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', leadId] });
      toast.success('Visita aprovada com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Reject lead
export function useRejectLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => post('/crm-events/reject-lead', { leadId }),
    onSuccess: (_, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['gate-approvals', leadId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-status', leadId] });
      toast.success('Lead rejeitado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
