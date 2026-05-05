import {
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileText,
  MessageSquare,
  Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  PurchaseStatus,
  PurchasePriority,
  PurchaseRequest,
} from '@/types/procurement';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TabType = 'resumo' | 'itens' | 'timeline' | 'comunicacao';

export type ActionModalType = 'approve' | 'reject' | 'submit' | 'cancel' | null;

export interface EditFormState {
  title: string;
  department: string;
  priority: PurchasePriority;
  justification: string;
  notes: string;
}

export interface ResumoTabProps {
  purchase: PurchaseRequest;
  isEditing: boolean;
  editForm: EditFormState;
  onEditFormChange: (updates: Partial<EditFormState>) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'resumo', label: 'Resumo', icon: FileText },
  { id: 'itens', label: 'Itens', icon: ShoppingCart },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'comunicacao', label: 'Comunicação', icon: MessageSquare },
];

export const STATUS_LABELS: Record<PurchaseStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING_MANAGER: 'Aguardando Gestor',
  PENDING_FINANCE: 'Aguardando Financeiro',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  PURCHASED: 'Comprada',
  CANCELLED: 'Cancelada',
};

export const STATUS_COLORS: Record<PurchaseStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700',
  PENDING_MANAGER: 'bg-amber-100 text-amber-700',
  PENDING_FINANCE: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  PURCHASED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-neutral-200 text-neutral-500',
};

export const PRIORITY_LABELS: Record<PurchasePriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const PRIORITY_COLORS: Record<PurchasePriority, string> = {
  LOW: 'bg-neutral-100 text-neutral-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

export const ACTION_TIMELINE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  SUBMITTED: { icon: Send, color: 'text-blue-500 bg-blue-100' },
  APPROVED: { icon: CheckCircle, color: 'text-green-500 bg-green-100' },
  REJECTED: { icon: XCircle, color: 'text-red-500 bg-red-100' },
  CANCELLED: { icon: XCircle, color: 'text-neutral-400 bg-neutral-100' },
  EXECUTED: { icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-100' },
};

export const DEPARTMENT_OPTIONS = [
  { value: 'IT', label: 'TI' },
  { value: 'Admin', label: 'Administração' },
  { value: 'Academic', label: 'Acadêmico' },
  { value: 'Maintenance', label: 'Manutenção' },
  { value: 'Cleaning', label: 'Limpeza' },
  { value: 'Finance', label: 'Financeiro' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  return format(new Date(dateStr), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR });
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
}

// ── Small Subcomponents ───────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <span className={`badge ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: PurchasePriority }) {
  return (
    <span className={`badge ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
