import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Contract, GateApprovalDecision } from '@/types/contract';

export interface PrerequisiteItem {
  key: string;
  label: string;
  met: boolean;
  detail?: string;
  blocking?: boolean;
}

/**
 * Invalidates all contract-related and lead-related queries after a contract mutation.
 * Uses broad prefix matching so any leadId-specific query is also caught.
 */
function invalidateContractRelated(queryClient: ReturnType<typeof useQueryClient>, leadId?: string) {
  queryClient.invalidateQueries({ queryKey: ['contracts'] });
  queryClient.invalidateQueries({ queryKey: ['contract-prerequisites'] });
  queryClient.invalidateQueries({ queryKey: ['gate-approvals'] });
  queryClient.invalidateQueries({ queryKey: ['pipeline-status'] });
  if (leadId) {
    queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  }
}

export function useContractPrerequisites(leadId: string | null) {
  return useQuery({
    queryKey: ['contract-prerequisites', leadId],
    queryFn: () => get<{ ready: boolean; items: PrerequisiteItem[] }>(`/contracts/prerequisites/${leadId}`),
    enabled: !!leadId,
  });
}

export function useLeadContracts(leadId: string | null) {
  return useQuery({
    queryKey: ['contracts', leadId],
    queryFn: () => get<Contract[]>(`/contracts/lead/${leadId}`),
    enabled: !!leadId,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      leadId: string;
      totalAnnualValue: number;
      installments: number;
      discountPercent?: number;
      enrollmentFee?: number;
      signers: Array<{ role: string; name: string; email: string; cpf?: string; phone?: string }>;
      paymentStartDate?: string;
    }) => post<Contract>('/contracts', data),
    onSuccess: (response, variables) => {
      invalidateContractRelated(queryClient, variables.leadId);
      toast.success('Contrato criado com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSendForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      post<Contract>(`/contracts/${id}/send`),
    onSuccess: (response) => {
      invalidateContractRelated(queryClient, response.data?.leadId);
      toast.success('Contrato enviado para assinatura');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSubmitLegalApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: GateApprovalDecision; notes?: string }) =>
      patch<Contract>(`/contracts/${id}/legal`, { decision, notes }),
    onSuccess: (response) => {
      invalidateContractRelated(queryClient, response.data?.leadId);
      toast.success('Parecer jurídico registrado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSubmitFinancialApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision, notes }: { id: string; decision: GateApprovalDecision; notes?: string }) =>
      patch<Contract>(`/contracts/${id}/financial`, { decision, notes }),
    onSuccess: (response) => {
      invalidateContractRelated(queryClient, response.data?.leadId);
      toast.success('Parecer financeiro registrado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      del(`/contracts/${id}`),
    onSuccess: () => {
      invalidateContractRelated(queryClient);
      toast.success('Contrato excluído');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useContractDocumentUrl() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await get<{ url: string }>(`/contracts/${id}/document`);
      return res.data;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSignedDocumentUrl() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await get<{ url: string }>(`/contracts/${id}/signed-document`);
      return res.data;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      post<Contract>(`/contracts/${id}/cancel`, { reason }),
    onSuccess: (response) => {
      invalidateContractRelated(queryClient, response.data?.leadId);
      toast.success('Contrato cancelado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
