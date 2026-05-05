import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type { AssetCategory, AssetLocation, CreateMaintenanceInput, CreateInventoryInput, InventorySession } from '@/types/assets';

// === Category Mutations ===

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; icon?: string }) =>
      post<AssetCategory>('/assets/config/categories', data),
    onSuccess: () => {
      toast.success('Categoria criada!');
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; icon?: string } }) =>
      patch(`/assets/config/categories/${id}`, data),
    onSuccess: () => {
      toast.success('Categoria atualizada!');
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/assets/config/categories/${id}`),
    onSuccess: () => {
      toast.success('Categoria removida!');
      queryClient.invalidateQueries({ queryKey: ['assetCategories'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// === Location Mutations ===

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; parentId?: string }) =>
      post<AssetLocation>('/assets/config/locations', data),
    onSuccess: () => {
      toast.success('Localização criada!');
      queryClient.invalidateQueries({ queryKey: ['assetLocations'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; parentId?: string } }) =>
      patch(`/assets/config/locations/${id}`, data),
    onSuccess: () => {
      toast.success('Localização atualizada!');
      queryClient.invalidateQueries({ queryKey: ['assetLocations'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/assets/config/locations/${id}`),
    onSuccess: () => {
      toast.success('Localização removida!');
      queryClient.invalidateQueries({ queryKey: ['assetLocations'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// === Maintenance Mutations ===

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: string; data: CreateMaintenanceInput }) =>
      post(`/assets/${assetId}/maintenance`, data),
    onSuccess: (_, { assetId }) => {
      toast.success('Manutenção agendada!');
      queryClient.invalidateQueries({ queryKey: ['assetMaintenance', assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMaintenance'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCompleteMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, maintenanceId, data }: { assetId: string; maintenanceId: string; data?: { cost?: number; notes?: string } }) =>
      post(`/assets/${assetId}/maintenance/${maintenanceId}/complete`, data),
    onSuccess: (_, { assetId }) => {
      toast.success('Manutenção concluída!');
      queryClient.invalidateQueries({ queryKey: ['assetMaintenance', assetId] });
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
      queryClient.invalidateQueries({ queryKey: ['upcomingMaintenance'] });
      queryClient.invalidateQueries({ queryKey: ['overdueMaintenance'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// === Inventory Mutations ===

export function useCreateInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventoryInput) => post<InventorySession>('/assets/inventory', data),
    onSuccess: () => {
      toast.success('Sessão de inventário criada!');
      queryClient.invalidateQueries({ queryKey: ['inventorySessions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useStartInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/assets/inventory/${id}/start`),
    onSuccess: (_, id) => {
      toast.success('Inventário iniciado!');
      queryClient.invalidateQueries({ queryKey: ['inventorySessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySession', id] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCheckInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, itemId, status, notes }: { sessionId: string; itemId: string; status: 'FOUND' | 'NOT_FOUND'; notes?: string }) =>
      post(`/assets/inventory/${sessionId}/items/${itemId}/check`, { status, notes }),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventorySession', sessionId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCompleteInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/assets/inventory/${id}/complete`),
    onSuccess: () => {
      toast.success('Inventário finalizado!');
      queryClient.invalidateQueries({ queryKey: ['inventorySessions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
