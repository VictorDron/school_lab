import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { Asset, AssetStats, AssetCategory, AssetLocation, AssetMaintenance, InventorySession } from '@/types/assets';

// === Asset Queries ===

export function useAssets(filters?: { search?: string; status?: string; categoryId?: string; locationId?: string }) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => get<Asset[]>('/assets', { params: filters }),
  });
}

export function useAsset(id?: string) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => get<Asset>(`/assets/${id}`),
    enabled: !!id,
  });
}

export function useAssetStats() {
  return useQuery({
    queryKey: ['assetStats'],
    queryFn: () => get<AssetStats>('/assets/stats/overview'),
  });
}

export function useAssetCategories() {
  return useQuery({
    queryKey: ['assetCategories'],
    queryFn: () => get<AssetCategory[]>('/assets/config/categories'),
  });
}

export function useAssetLocations() {
  return useQuery({
    queryKey: ['assetLocations'],
    queryFn: () => get<AssetLocation[]>('/assets/config/locations'),
  });
}

// === Maintenance Queries ===

export function useAssetMaintenance(assetId?: string) {
  return useQuery({
    queryKey: ['assetMaintenance', assetId],
    queryFn: () => get<AssetMaintenance[]>(`/assets/${assetId}/maintenance`),
    enabled: !!assetId,
  });
}

export function useUpcomingMaintenance() {
  return useQuery({
    queryKey: ['upcomingMaintenance'],
    queryFn: () => get<AssetMaintenance[]>('/assets/maintenance/upcoming'),
  });
}

export function useOverdueMaintenance() {
  return useQuery({
    queryKey: ['overdueMaintenance'],
    queryFn: () => get<AssetMaintenance[]>('/assets/maintenance/overdue'),
  });
}

// === Inventory Queries ===

export function useInventorySessions() {
  return useQuery({
    queryKey: ['inventorySessions'],
    queryFn: () => get<InventorySession[]>('/assets/inventory'),
  });
}

export function useInventorySession(id?: string) {
  return useQuery({
    queryKey: ['inventorySession', id],
    queryFn: () => get<InventorySession>(`/assets/inventory/${id}`),
    enabled: !!id,
  });
}
