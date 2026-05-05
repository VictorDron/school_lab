import { motion } from 'framer-motion';
import { X, Mail, Briefcase } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { DmUser } from './ChannelHeader';

interface DmProfilePanelProps {
  dmUser: DmUser;
  isOnline: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  COORDINATOR: 'Coordenador',
  TEACHER: 'Professor',
  SECRETARY: 'Secretaria',
  STAFF: 'Funcionário',
  IT: 'TI',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
  PURCHASING: 'Compras',
  FINANCE: 'Financeiro',
  ADMISSIONS: 'Admissões',
};

export default function DmProfilePanel({ dmUser, isOnline, onClose }: DmProfilePanelProps) {
  return (
    <motion.div
      key="dm-profile-panel"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full sm:w-72 max-w-full border-l border-neutral-200 bg-white flex flex-col h-full flex-shrink-0 absolute sm:relative right-0 z-30 sm:z-auto"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-neutral-900 text-sm">Perfil</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Profile content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center pt-8 pb-6 px-4">
          <div className="relative">
            <Avatar
              src={dmUser.avatarUrl}
              name={dmUser.displayName}
              size="xl"
            />
            <span
              className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                isOnline ? 'bg-green-500' : 'bg-neutral-300'
              }`}
            />
          </div>
          <h4 className="mt-3 font-semibold text-neutral-900 text-base">
            {dmUser.displayName}
          </h4>
          <span className={`mt-1 text-xs font-medium ${isOnline ? 'text-green-600' : 'text-neutral-400'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className="px-4 space-y-4">
          {dmUser.role && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Cargo</p>
                <p className="text-sm text-neutral-900 font-medium">
                  {ROLE_LABELS[dmUser.role] || dmUser.role}
                </p>
              </div>
            </div>
          )}

          {dmUser.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-neutral-500">Email</p>
                <p className="text-sm text-neutral-900 break-all">{dmUser.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
