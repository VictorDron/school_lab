import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put, post, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

export interface ContractDefaultSigner {
  id: string;
  role: 'SCHOOL_REPRESENTATIVE' | 'WITNESS';
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSignerPayload {
  role: 'SCHOOL_REPRESENTATIVE' | 'WITNESS';
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}

export function useContractDefaultSigners() {
  return useQuery({
    queryKey: ['contractDefaultSigners'],
    queryFn: () => get<ContractDefaultSigner[]>('/contract-default-signers'),
  });
}

export function useReplaceDefaultSigners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signers: CreateSignerPayload[]) =>
      put<ContractDefaultSigner[]>('/contract-default-signers', { signers }),
    onSuccess: () => {
      toast.success('Signatários padrão salvos com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['contractDefaultSigners'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBatchCreateContracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { periodId: string; inviteIds: string[]; sendForSignature: boolean }) =>
      post<{ total: number; created: number; skipped: number; errors: number }>(
        `/re-enrollment/periods/${params.periodId}/contracts/batch`,
        {
          inviteIds: params.inviteIds,
          sendForSignature: params.sendForSignature,
        },
      ),
    onSuccess: (data) => {
      const result = data?.data;
      if (result) {
        toast.success(`${result.created} de ${result.total} contrato(s) criado(s) com sucesso!`);
      }
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['inviteContract'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
