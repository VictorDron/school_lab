import { Package, Wrench, Clock, ChevronRight } from 'lucide-react';
import type { AssetStatus, MaintenanceType, MaintenanceStatus } from '@/types/assets';

// ---------------------------------------------------------------------------
// Status palettes for the badges rendered across the drawer.
// ---------------------------------------------------------------------------

export const statusColors: Record<AssetStatus, string> = {
  AVAILABLE: 'bg-success-100 text-success-700',
  IN_USE: 'bg-primary-100 text-primary-700',
  MAINTENANCE: 'bg-warning-100 text-warning-700',
  DECOMMISSIONED: 'bg-neutral-100 text-neutral-500',
};

export const statusLabels: Record<AssetStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em uso',
  MAINTENANCE: 'Manutenção',
  DECOMMISSIONED: 'Desativado',
};

export const maintenanceTypeColors: Record<MaintenanceType, string> = {
  PREVENTIVE: 'bg-blue-100 text-blue-700',
  CORRECTIVE: 'bg-red-100 text-red-700',
  INSPECTION: 'bg-yellow-100 text-yellow-700',
  CALIBRATION: 'bg-purple-100 text-purple-700',
  CLEANING: 'bg-neutral-100 text-neutral-600',
};

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  PREVENTIVE: 'Preventiva',
  CORRECTIVE: 'Corretiva',
  INSPECTION: 'Inspeção',
  CALIBRATION: 'Calibração',
  CLEANING: 'Limpeza',
};

export const maintenanceStatusColors: Record<MaintenanceStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
  OVERDUE: 'bg-red-100 text-red-700',
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  OVERDUE: 'Atrasada',
};

// ---------------------------------------------------------------------------
// Tab navigation config.
// ---------------------------------------------------------------------------

export type TabId = 'geral' | 'manutencao' | 'historico' | 'comunicacao';

export const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'geral', label: 'Geral', icon: Package },
  { id: 'manutencao', label: 'Manutenção', icon: Wrench },
  { id: 'historico', label: 'Histórico', icon: Clock },
  { id: 'comunicacao', label: 'Comunicação', icon: ChevronRight },
];
