import type { PurchasePriority, PurchaseStatus } from '@prisma/client';

export interface PurchaseFilters {
  status?: PurchaseStatus;
  department?: string;
  createdByMe?: boolean;
  createdById?: string;
  search?: string;
}

export interface PurchasePagination {
  page: number;
  limit: number;
  skip: number;
}

export interface CreatePurchaseData {
  title: string;
  department: string;
  priority: PurchasePriority;
  justification: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice: number;
  }>;
  notes?: string;
}

export interface UpdatePurchaseData {
  title?: string;
  department?: string;
  priority?: PurchasePriority;
  justification?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice: number;
  }>;
  notes?: string | null;
}

export interface ExecutePurchaseData {
  supplierId?: string;
  invoiceNumber?: string;
  items?: Array<{
    purchaseItemId: string;
    actualQuantity: number;
    actualUnitPrice: number;
    createAsset?: boolean;
    assetCategoryId?: string;
    assetLocationId?: string;
  }>;
  notes?: string;
}
