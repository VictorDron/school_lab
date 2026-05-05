import { motion } from 'framer-motion';
import { AlertCircle, Clock, Eye, FileText, FolderOpen, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { AuditLog } from './constants';
import { getActionInfo, getColorClasses } from './helpers';

interface AuditLogListProps {
  logs: AuditLog[];
  isLoading: boolean;
  activeFiltersCount: number;
  onSelectLog: (log: AuditLog) => void;
  onClearFilters: () => void;
}

export function AuditLogList({
  logs,
  isLoading,
  activeFiltersCount,
  onSelectLog,
  onClearFilters,
}: AuditLogListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-neutral-700">Nenhum registro encontrado</p>
        <p className="text-sm text-neutral-500 mt-1">Tente ajustar os filtros de busca</p>
        {activeFiltersCount > 0 && (
          <button onClick={onClearFilters} className="btn btn-secondary btn-sm mt-4">
            Limpar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {logs.map((log, index) => {
        const actionInfo = getActionInfo(log.action);
        const Icon = actionInfo.icon;
        const colorClasses = getColorClasses(actionInfo.color);
        const isFailure = log.action.includes('FAILURE') || log.action.includes('REJECTED');

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.01 }}
            className={`px-4 lg:px-6 py-3 hover:bg-neutral-50 transition-colors cursor-pointer ${
              isFailure ? 'bg-red-50/30' : ''
            }`}
            onClick={() => onSelectLog(log)}
          >
            <div className="flex items-start gap-3">
              <Avatar src={log.actor?.avatarUrl} name={log.actorEmail} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-neutral-900 text-sm">
                    {log.actor?.displayName || log.actorEmail}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.badge}`}
                  >
                    <Icon className="w-3 h-3" />
                    {actionInfo.label}
                  </span>
                  {isFailure && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <AlertCircle className="w-3 h-3" />
                      Falha
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 flex-wrap">
                  {log.entityType && (
                    <span className="inline-flex items-center gap-1">
                      <FolderOpen className="w-3 h-3" />
                      {log.entityType}
                      {log.entityId && (
                        <span className="text-neutral-400 font-mono">#{log.entityId.slice(0, 8)}</span>
                      )}
                    </span>
                  )}
                  {log.ipAddress && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {log.ipAddress}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>

              <button
                className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLog(log);
                }}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
