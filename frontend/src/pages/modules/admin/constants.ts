import {
  Users,
  Clock,
  Archive,
  CheckCircle,
  Mail,
  MailX,
  Settings,
  Shield,
} from 'lucide-react';
import type { Tab, StatusFilter, InviteStatusFilter } from './types';

export const tabs: { id: Tab; icon: typeof Users; label: string }[] = [
  { id: 'users', icon: Users, label: 'Usuários' },
  { id: 'invites', icon: Mail, label: 'Convites' },
  { id: 'audit', icon: Shield, label: 'Auditoria' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
];

export const statusFilters: { id: StatusFilter; label: string; icon: typeof Users; color: string }[] = [
  { id: 'ALL', label: 'Todos', icon: Users, color: 'neutral' },
  { id: 'ACTIVE', label: 'Ativos', icon: CheckCircle, color: 'success' },
  { id: 'PENDING', label: 'Pendentes', icon: Clock, color: 'warning' },
  { id: 'ARCHIVED', label: 'Arquivados', icon: Archive, color: 'neutral' },
];

export const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  STAFF: 'Funcionário',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  SECRETARY: 'Secretaria',
  IT: 'TI',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
  PURCHASING: 'Compras',
  FINANCE: 'Financeiro',
  ADMISSIONS: 'Admissões',
  PSYCHOLOGY: 'Psicologia',
  HEALTH: 'Saúde',
  LEGAL: 'Jurídico',
  DIRECTOR: 'Diretoria',
};

export const inviteStatusFilters: { id: InviteStatusFilter; label: string; icon: typeof Mail; color: string }[] = [
  { id: 'ALL', label: 'Todos', icon: Mail, color: 'neutral' },
  { id: 'PENDING', label: 'Pendentes', icon: Clock, color: 'warning' },
  { id: 'USED', label: 'Utilizados', icon: CheckCircle, color: 'success' },
  { id: 'EXPIRED', label: 'Expirados', icon: MailX, color: 'error' },
];
