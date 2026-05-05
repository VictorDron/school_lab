import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { ContractAddendum } from '@/types/contract';

export function useContractAddendums(contractId: string | null) {
  return useQuery({
    queryKey: ['addendums', contractId],
    queryFn: () => get<ContractAddendum[]>(`/addendums/contract/${contractId}`),
    enabled: !!contractId,
  });
}

export function useCreateAddendum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contractId: string;
      type: string;
      description: string;
      changedValues?: Array<{ field: string; oldValue: string; newValue: string }>;
      signers: Array<{ role: string; name: string; email: string; cpf?: string; phone?: string }>;
    }) => post<ContractAddendum>('/addendums', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addendums'] });
      toast.success('Aditivo criado com sucesso');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useGenerateAddendumPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      post<ContractAddendum>(`/addendums/${id}/generate-document`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addendums'] });
      toast.success('PDF do aditivo gerado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSendAddendumForSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      post<ContractAddendum>(`/addendums/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addendums'] });
      toast.success('Aditivo enviado para assinatura');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelAddendum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      post<ContractAddendum>(`/addendums/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addendums'] });
      toast.success('Aditivo cancelado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAddendumDocumentUrl() {
  return useMutation({
    mutationFn: async ({ id, signed }: { id: string; signed?: boolean }) => {
      const endpoint = signed
        ? `/addendums/${id}/signed-document`
        : `/addendums/${id}/document`;
      const res = await get<{ url: string }>(endpoint);
      return res.data;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
