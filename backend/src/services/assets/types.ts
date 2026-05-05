import type {
  AssetStatus,
  InventoryItemStatus,
  MaintenanceType,
  PurchasePriority,
} from '@prisma/client';

export interface AssetFilters {
  status?: AssetStatus;
  categoryId?: string;
  locationId?: string;
  responsibleId?: string;
  search?: string;
}

export interface AssetPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface CreateAssetData {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  status?: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  warranty?: string;
  notes?: string;
}

export interface UpdateAssetData {
  name?: string;
  description?: string;
  categoryId?: string;
  locationId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  currentValue?: number;
  warranty?: string;
  notes?: string;
  depreciationRate?: number;
}

export interface CreateMaintenanceData {
  type?: MaintenanceType;
  description: string;
  scheduledDate?: string;
  priority?: PurchasePriority;
  vendor?: string;
  notes?: string;
  cost?: number;
}

export interface CompleteMaintenanceData {
  cost?: number;
  notes?: string;
}

export interface CheckInventoryItemData {
  status: InventoryItemStatus;
  notes?: string;
}
