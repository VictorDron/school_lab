import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  LeadChild,
  CreateChildData,
  UpdateChildData,
} from '@/types/crm';
import { invalidateLeadRelated } from './useLeadDashboard';

// ==================== CHILDREN MUTATIONS ====================

// Add child to lead
export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: CreateChildData }) =>
      post<LeadChild>(`/leads/${leadId}/children`, data),
    onSuccess: (_, variables) => {
      toast.success('Criança adicionada!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update child
export function useUpdateChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      childId,
      data,
    }: {
      leadId: string;
      childId: string;
      data: UpdateChildData;
    }) => patch<LeadChild>(`/leads/${leadId}/children/${childId}`, data),
    onSuccess: (_, variables) => {
      toast.success('Criança atualizada!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete child
export function useDeleteChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, childId }: { leadId: string; childId: string }) =>
      del(`/leads/${leadId}/children/${childId}`),
    onSuccess: (_, variables) => {
      toast.success('Criança removida!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update parent
export function useUpdateParent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      parentId,
      data,
    }: {
      leadId: string;
      parentId: string;
      data: Record<string, any>;
    }) => patch(`/leads/${leadId}/parents/${parentId}`, data),
    onSuccess: (_, variables) => {
      toast.success('Dados do responsável atualizados!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update address
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      data,
    }: {
      leadId: string;
      data: Record<string, any>;
    }) => patch(`/leads/${leadId}/address`, data),
    onSuccess: (_, variables) => {
      toast.success('Endereço atualizado!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update child health
export function useUpdateChildHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, childId, data }: { leadId: string; childId: string; data: Record<string, any> }) =>
      patch(`/leads/${leadId}/children/${childId}/health`, data),
    onSuccess: (_, v) => {
      toast.success('Dados de saúde atualizados!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Update child transport
export function useUpdateChildTransport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, childId, data }: { leadId: string; childId: string; data: Record<string, any> }) =>
      patch(`/leads/${leadId}/children/${childId}/transport`, data),
    onSuccess: (_, v) => {
      toast.success('Dados de transporte atualizados!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Create emergency contact
export function useCreateEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: Record<string, any> }) =>
      post(`/leads/${leadId}/emergency-contacts`, data),
    onSuccess: (_, v) => {
      toast.success('Contato de emergência adicionado!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Update emergency contact
export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, contactId, data }: { leadId: string; contactId: string; data: Record<string, any> }) =>
      patch(`/leads/${leadId}/emergency-contacts/${contactId}`, data),
    onSuccess: (_, v) => {
      toast.success('Contato de emergência atualizado!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Delete emergency contact
export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, contactId }: { leadId: string; contactId: string }) =>
      del(`/leads/${leadId}/emergency-contacts/${contactId}`),
    onSuccess: (_, v) => {
      toast.success('Contato de emergência removido!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Update financial responsible
export function useUpdateFinancialResponsible() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: Record<string, any> }) =>
      patch(`/leads/${leadId}/financial-responsible`, data),
    onSuccess: (_, v) => {
      toast.success('Responsável financeiro atualizado!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Update health plan
export function useUpdateHealthPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: Record<string, any> }) =>
      patch(`/leads/${leadId}/health-plan`, data),
    onSuccess: (_, v) => {
      toast.success('Plano de saúde atualizado!');
      invalidateLeadRelated(queryClient, v.leadId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
