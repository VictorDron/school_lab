import type { Dispatch, SetStateAction } from 'react';
import {
  Activity,
  FolderOpen,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Ticket,
  TrendingUp,
  User,
} from 'lucide-react';
import { endOfDay, startOfDay, subDays, subMonths } from 'date-fns';

export interface AuditLog {
  id: string;
  actorId?: string;
  actorEmail: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  actor?: { id: string; email: string; displayName: string; avatarUrl?: string };
}

export interface AuditResponse {
  logs: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AuditFilters {
  page: number;
  limit: number;
  searchQuery: string;
  selectedUser: string;
  selectedCategory: string;
  selectedAction: string;
  selectedEntityType: string;
  selectedDateRange: string;
  customStartDate: string;
  customEndDate: string;
  showFilters: boolean;
  selectedLog: AuditLog | null;
}

export interface AuditFiltersSetters {
  setPage: Dispatch<SetStateAction<number>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedUser: Dispatch<SetStateAction<string>>;
  setSelectedCategory: Dispatch<SetStateAction<string>>;
  setSelectedAction: Dispatch<SetStateAction<string>>;
  setSelectedEntityType: Dispatch<SetStateAction<string>>;
  setSelectedDateRange: Dispatch<SetStateAction<string>>;
  setCustomStartDate: Dispatch<SetStateAction<string>>;
  setCustomEndDate: Dispatch<SetStateAction<string>>;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  setSelectedLog: Dispatch<SetStateAction<AuditLog | null>>;
}

export interface AuditStats {
  actionCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
}

export const actionCategories: Record<
  string,
  { label: string; icon: typeof Activity; color: string; actions: string[] }
> = {
  AUTH: {
    label: 'Autenticação',
    icon: Shield,
    color: 'blue',
    actions: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILURE'],
  },
  USER: {
    label: 'Usuários',
    icon: User,
    color: 'purple',
    actions: ['USER_CREATED', 'USER_UPDATED', 'USER_ARCHIVED', 'USER_ACTIVATED', 'USER_DELETED', 'PROFILE_UPDATED', 'INVITE_SENT', 'INVITE_ACCEPTED'],
  },
  TICKET: {
    label: 'Chamados',
    icon: Ticket,
    color: 'orange',
    actions: ['TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_ASSIGNED', 'TICKET_COMMENTED', 'TICKET_CLOSED'],
  },
  CHANNEL: {
    label: 'Comunicação',
    icon: MessageSquare,
    color: 'green',
    actions: ['CHANNEL_CREATED', 'CHANNEL_UPDATED', 'CHANNEL_DELETED', 'MESSAGE_SENT'],
  },
  PURCHASE: {
    label: 'Compras',
    icon: ShoppingCart,
    color: 'emerald',
    actions: ['PURCHASE_CREATED', 'PURCHASE_UPDATED', 'PURCHASE_SUBMITTED', 'PURCHASE_APPROVED', 'PURCHASE_REJECTED', 'PURCHASE_EXECUTED'],
  },
  ASSET: {
    label: 'Patrimônio',
    icon: Package,
    color: 'amber',
    actions: ['ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_MOVED', 'ASSET_ASSIGNED', 'ASSET_UNASSIGNED', 'INVENTORY_STARTED', 'INVENTORY_COMPLETED'],
  },
  CRM: {
    label: 'CRM',
    icon: TrendingUp,
    color: 'pink',
    actions: ['LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_STATUS_CHANGED', 'LEAD_DELETED'],
  },
  DOCUMENT: {
    label: 'Documentos',
    icon: FolderOpen,
    color: 'cyan',
    actions: ['DOCUMENT_UPLOADED', 'DOCUMENT_UPDATED', 'DOCUMENT_VIEWED', 'DOCUMENT_DELETED'],
  },
  SETTINGS: {
    label: 'Configurações',
    icon: Settings,
    color: 'gray',
    actions: ['SETTINGS_UPDATED'],
  },
};

export const dateRanges = [
  { id: 'today', label: 'Hoje', getValue: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) },
  { id: 'yesterday', label: 'Ontem', getValue: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) },
  { id: 'last7', label: 'Últimos 7 dias', getValue: () => ({ start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) }) },
  { id: 'last30', label: 'Últimos 30 dias', getValue: () => ({ start: startOfDay(subDays(new Date(), 30)), end: endOfDay(new Date()) }) },
  { id: 'last3months', label: 'Últimos 3 meses', getValue: () => ({ start: startOfDay(subMonths(new Date(), 3)), end: endOfDay(new Date()) }) },
  { id: 'all', label: 'Todo período', getValue: () => ({ start: undefined, end: undefined }) },
];
