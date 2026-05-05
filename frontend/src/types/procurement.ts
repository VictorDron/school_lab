// Procurement types

export type PurchaseStatus = 'DRAFT' | 'PENDING_MANAGER' | 'PENDING_FINANCE' | 'APPROVED' | 'REJECTED' | 'PURCHASED' | 'CANCELLED';
export type PurchasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface PurchaseRequest {
  id: string;
  code: string;
  title: string;
  department: string;
  priority: PurchasePriority;
  status: PurchaseStatus;
  justification: string;
  totalAmount: number;
  attachments?: string[];
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  purchasedAt?: string;
  createdAt: string;
  updatedAt: string;
  creator: UserSummary;
  items: PurchaseItem[];
  approvalActions?: ApprovalAction[];
  purchaseOrder?: PurchaseOrder;
}

export interface PurchaseItem {
  id: string;
  purchaseRequestId: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface ApprovalAction {
  id: string;
  purchaseRequestId: string;
  userId: string;
  action: string;
  comments?: string;
  previousStatus: PurchaseStatus;
  newStatus: PurchaseStatus;
  createdAt: string;
  user: UserSummary;
}

export interface PurchaseOrder {
  id: string;
  purchaseRequestId: string;
  supplierId?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  totalAmount?: number;
  notes?: string;
  autoCreateAssets: boolean;
  executedAt?: string;
  executedBy?: UserSummary;
  supplier?: Supplier;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cnpj?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { purchaseOrders: number };
  _totalSpent?: number;
}

export interface UserSummary {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
}

export interface PurchaseFilters {
  search?: string;
  status?: PurchaseStatus;
  department?: string;
  priority?: PurchasePriority;
  createdByMe?: boolean;
}

export interface PurchaseStats {
  pending: number;
  approved: number;
  total: number;
  totalSpent: number;
}

export interface TimelineEvent {
  action: string;
  actor: UserSummary;
  timestamp: string;
  comments?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface CreatePurchaseInput {
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

export interface ExecutePurchaseInput {
  supplierId: string;
  invoiceNumber?: string;
  items: Array<{
    purchaseItemId: string;
    actualQuantity: number;
    actualUnitPrice: number;
    createAsset: boolean;
    assetCategoryId?: string;
    assetLocationId?: string;
  }>;
  notes?: string;
}
