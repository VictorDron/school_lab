import type { PurchaseRequest } from '@/types/procurement';

export interface ExecutePurchaseModalProps {
  purchase: PurchaseRequest;
  onClose: () => void;
}

export interface ItemRow {
  purchaseItemId: string;
  description: string;
  unit: string;
  estimatedQuantity: number;
  estimatedUnitPrice: number;
  actualQuantity: number;
  actualUnitPrice: number;
  included: boolean;
  createAsset: boolean;
  assetCategoryId: string;
  assetLocationId: string;
}

export interface NewSupplierFormFields {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
}
