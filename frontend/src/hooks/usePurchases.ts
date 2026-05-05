import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { PurchaseRequest, PurchaseStats, Supplier, PurchaseFilters, CreatePurchaseInput, ExecutePurchaseInput } from '@/types/procurement';

// === Purchase Queries ===

export function usePurchases(filters?: PurchaseFilters) {
  return useQuery({
    queryKey: ['purchases', filters],
    queryFn: () => get<PurchaseRequest[]>('/purchases', {
      params: {
        search: filters?.search || undefined,
        status: filters?.status || undefined,
        department: filters?.department || undefined,
        priority: filters?.priority || undefined,
        createdByMe: filters?.createdByMe ? 'true' : undefined,
      },
    }),
  });
}

export function usePurchase(id?: string) {
  return useQuery({
    queryKey: ['purchase', id],
    queryFn: () => get<PurchaseRequest>(`/purchases/${id}`),
    enabled: !!id,
  });
}

export function usePurchaseStats() {
  return useQuery({
    queryKey: ['purchaseStats'],
    queryFn: () => get<PurchaseStats>('/purchases/stats/overview'),
  });
}

// === Purchase Mutations ===

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePurchaseInput) => post<PurchaseRequest>('/purchases', data),
    onSuccess: () => {
      toast.success('Requisição criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePurchaseInput> }) =>
      patch<PurchaseRequest>(`/purchases/${id}`, data),
    onSuccess: (_, { id }) => {
      toast.success('Requisição atualizada!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSubmitPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/purchases/${id}/submit`),
    onSuccess: () => {
      toast.success('Requisição submetida para aprovação!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useApprovePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, comments }: { id: string; action: 'approve' | 'reject'; comments?: string }) =>
      post(`/purchases/${id}/approve`, { action, comments }),
    onSuccess: () => {
      toast.success('Ação realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useExecutePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExecutePurchaseInput }) =>
      post(`/purchases/${id}/execute`, data),
    onSuccess: () => {
      toast.success('Compra executada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      post(`/purchases/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Requisição cancelada.');
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// === Supplier Queries ===

export function useSuppliers(filters?: { search?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => get<Supplier[]>('/suppliers', {
      params: {
        search: filters?.search || undefined,
        isActive: filters?.isActive !== undefined ? String(filters.isActive) : undefined,
      },
    }),
  });
}

export function useSupplier(id?: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => get<Supplier>(`/suppliers/${id}`),
    enabled: !!id,
  });
}

// === Supplier Mutations ===

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => post<Supplier>('/suppliers', data),
    onSuccess: () => {
      toast.success('Fornecedor criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      patch<Supplier>(`/suppliers/${id}`, data),
    onSuccess: (_, { id }) => {
      toast.success('Fornecedor atualizado!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/suppliers/${id}`),
    onSuccess: () => {
      toast.success('Fornecedor arquivado.');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
