import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Asset, CreateAssetInput } from '@/types/assets';

// === Asset Mutations ===

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetInput) => post<Asset>('/assets', data),
    onSuccess: () => {
      toast.success('Ativo cadastrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetInput> }) =>
      patch<Asset>(`/assets/${id}`, data),
    onSuccess: (_, { id }) => {
      toast.success('Ativo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useMoveAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, locationId, reason }: { id: string; locationId: string; reason?: string }) =>
      post(`/assets/${id}/move`, { locationId, reason }),
    onSuccess: (_, { id }) => {
      toast.success('Ativo movimentado!');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string | null }) =>
      post(`/assets/${id}/assign`, { userId }),
    onSuccess: (_, { id }) => {
      toast.success('Responsável atualizado!');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDecommissionAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      post(`/assets/${id}/decommission`, { reason }),
    onSuccess: () => {
      toast.success('Ativo desativado.');
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
