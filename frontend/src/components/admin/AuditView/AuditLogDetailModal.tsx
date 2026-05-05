import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Globe, Info, Monitor, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '@/components/ui/Avatar';
import { AuditLog, actionCategories } from './constants';
import { getActionInfo, getColorClasses } from './helpers';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: AuditLogDetailModalProps) {
  return (
    <AnimatePresence>
      {log && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(getActionInfo(log.action).color).bg}`}>
                    {(() => {
                      const Icon = getActionInfo(log.action).icon;
                      return <Icon className={`w-5 h-5 ${getColorClasses(getActionInfo(log.action).color).text}`} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Detalhes do Evento</h2>
                    <p className="text-sm text-neutral-500">
                      {format(new Date(log.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Modal content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
                {/* User info */}
                <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                  <Avatar src={log.actor?.avatarUrl} name={log.actorEmail} size="lg" />
                  <div>
                    <p className="font-medium text-neutral-900">
                      {log.actor?.displayName || 'Usuário não identificado'}
                    </p>
                    <p className="text-sm text-neutral-500">{log.actorEmail}</p>
                  </div>
                </div>

                {/* Action details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide block">Ação</label>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${getColorClasses(getActionInfo(log.action).color).bg}`}>
                      {(() => {
                        const Icon = getActionInfo(log.action).icon;
                        return <Icon className={`w-4 h-4 ${getColorClasses(getActionInfo(log.action).color).text}`} />;
                      })()}
                      <span className={`font-medium ${getColorClasses(getActionInfo(log.action).color).text}`}>
                        {getActionInfo(log.action).label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide block">Categoria</label>
                    <p className="text-neutral-900 py-2">
                      {actionCategories[getActionInfo(log.action).category]?.label || 'Outro'}
                    </p>
                  </div>

                  {log.entityType && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide block">Tipo de Entidade</label>
                      <p className="text-neutral-900 py-2">{log.entityType}</p>
                    </div>
                  )}

                  {log.entityId && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide block">ID da Entidade</label>
                      <p className="text-neutral-900 font-mono text-sm py-2">{log.entityId}</p>
                    </div>
                  )}
                </div>

                {/* Technical details */}
                <div className="border-t border-neutral-200 pt-4 space-y-4">
                  <h4 className="text-sm font-medium text-neutral-700">Informações Técnicas</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Endereço IP
                      </label>
                      <p className="text-neutral-900 font-mono text-sm">{log.ipAddress || 'Não disponível'}</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Timestamp
                      </label>
                      <p className="text-neutral-900 font-mono text-sm">
                        {new Date(log.createdAt).toISOString()}
                      </p>
                    </div>
                  </div>

                  {log.userAgent && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        User Agent
                      </label>
                      <p className="text-neutral-700 text-sm break-all bg-neutral-50 p-2 rounded font-mono">
                        {log.userAgent}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="border-t border-neutral-200 pt-4 space-y-4">
                    <h4 className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Metadados Adicionais
                    </h4>
                    <div className="bg-neutral-50 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-neutral-700 font-mono whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* ID */}
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>ID do Evento</span>
                    <span className="font-mono">{log.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
