import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, del, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import type { ApplicationLinkResponse } from '@/types/crm';
import type { EnrollmentLinkResponse } from '@/types/enrollment';
import { invalidateLeadRelated } from './useLeadDashboard';

// Generate application link (with 7-day expiration)
export function useGenerateApplicationLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      post<ApplicationLinkResponse>(`/leads/${id}/application-link`),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['tokenStatus', id] });
      if (response.data?.applicationLink) {
        navigator.clipboard.writeText(response.data.applicationLink);
        toast.success('Link gerado e copiado! Expira em 7 dias.');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Revoke application token
export function useRevokeToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del(`/leads/${id}/token`),
    onSuccess: (_, id) => {
      toast.success('Link de inscrição revogado!');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['tokenStatus', id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Generate enrollment link (with 7-day expiration)
export function useGenerateEnrollmentLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      post<EnrollmentLinkResponse>(`/leads/${id}/enrollment-link`),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['enrollmentStatus', id] });
      if (response.data?.enrollmentLink) {
        navigator.clipboard.writeText(response.data.enrollmentLink);
        toast.success('Link de matrícula gerado e copiado! Expira em 7 dias.');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Revoke enrollment token
export function useRevokeEnrollmentToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => del(`/leads/${id}/enrollment-token`),
    onSuccess: (_, id) => {
      toast.success('Link de matrícula revogado!');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['enrollmentStatus', id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Send application link by email
export function useSendApplicationLinkEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      post<{ sentTo: string }>(`/leads/${id}/application-link/send-email`),
    onSuccess: (response, id) => {
      const sentTo = response.data?.sentTo;
      toast.success(sentTo ? `Email enviado para ${sentTo}!` : 'Email enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Send enrollment link by email
export function useSendEnrollmentLinkEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      post<{ sentTo: string }>(`/leads/${id}/enrollment-link/send-email`),
    onSuccess: (response, id) => {
      const sentTo = response.data?.sentTo;
      toast.success(sentTo ? `Email de matrícula enviado para ${sentTo}!` : 'Email de matrícula enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Upload document to lead
export function useUploadLeadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      file,
      type,
      name,
      childId,
    }: {
      leadId: string;
      file: File;
      type?: string;
      name?: string;
      childId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (type) formData.append('type', type);
      if (name) formData.append('name', name);
      if (childId) formData.append('childId', childId);

      const token = useAuthStore.getState().token;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/leads/${leadId}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha no upload');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success('Documento enviado!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar documento');
    },
  });
}
