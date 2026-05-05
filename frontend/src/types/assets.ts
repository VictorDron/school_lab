// Assets types
import type { UserSummary } from './procurement';

export type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED';
export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION' | 'CALIBRATION' | 'CLEANING';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type InventoryStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type InventoryItemStatus = 'FOUND' | 'PENDING' | 'NOT_FOUND' | 'DISCREPANCY';

export interface Asset {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  currentValue?: number;
  warranty?: string;
  photoUrl?: string;
  qrCodeUrl?: string;
  responsibleId?: string;
  createdById: string;
  purchaseOrderId?: string;
  depreciationRate?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  category?: AssetCategory;
  location?: AssetLocation;
  responsible?: UserSummary;
  createdBy?: UserSummary;
  movements?: AssetMovement[];
  maintenance?: AssetMaintenance[];
}

export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { assets: number };
}

export interface AssetLocation {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: AssetLocation;
  children?: AssetLocation[];
  createdAt: string;
  updatedAt: string;
  _count?: { assets: number };
}

export interface AssetMovement {
  id: string;
  assetId: string;
  fromLocationId: string;
  toLocationId: string;
  reason?: string;
  movedAt: string;
  fromLocation?: AssetLocation;
  toLocation?: AssetLocation;
  movedBy?: UserSummary;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  type: MaintenanceType;
  description: string;
  cost?: number;
  scheduledDate?: string;
  startDate?: string;
  endDate?: string;
  status: MaintenanceStatus;
  priority: string;
  vendor?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  createdBy?: UserSummary;
  completedBy?: UserSummary;
}

export interface InventorySession {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: InventoryStatus;
  locationId?: string;
  categoryId?: string;
  totalAssets: number;
  foundCount: number;
  missingCount: number;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  startedBy?: UserSummary;
  completedBy?: UserSummary;
  location?: AssetLocation;
  category?: AssetCategory;
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  sessionId: string;
  assetId: string;
  status: InventoryItemStatus;
  checkedAt?: string;
  notes?: string;
  asset?: Asset;
  checkedBy?: UserSummary;
}

export interface AssetStats {
  total: number;
  available: number;
  inUse: number;
  maintenance: number;
  byCategory: Array<{ categoryId: string; _count: { id: number } }>;
}

export interface CreateAssetInput {
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

export interface CreateMaintenanceInput {
  type: MaintenanceType;
  description: string;
  scheduledDate?: string;
  priority?: string;
  vendor?: string;
  notes?: string;
  cost?: number;
}

export interface CreateInventoryInput {
  name: string;
  description?: string;
  locationId?: string;
  categoryId?: string;
}
