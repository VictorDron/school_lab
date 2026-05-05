import { motion } from 'framer-motion';
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  MapPin,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguageStore } from '@/stores/languageStore';
import { inventoryStatusColors, inventoryStatusLabels, tabVariants } from './constants';
import type { InventorySession } from '@/types/assets';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InventoryTabProps {
  sessions: InventorySession[];
  isLoading: boolean;
  onInventoryClick: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InventoryTab({
  sessions,
  onInventoryClick,
}: InventoryTabProps) {
  const { t } = useLanguageStore();

  return (
    <motion.div
      key="inventory"
      variants={tabVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="p-4 lg:p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          {t('resources.inventorySessions')}
        </h3>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardCheck className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">
            {t('resources.noInventory')}
          </p>
          <p className="text-neutral-500">{t('resources.noInventoryHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, index) => {
            const progress =
              session.totalAssets > 0
                ? Math.round(
                    ((session.foundCount + session.missingCount) / session.totalAssets) * 100
                  )
                : 0;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => onInventoryClick(session.id)}
                className="card p-5 hover:shadow-medium transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-neutral-400">{session.code}</span>
                      <span
                        className={`badge text-xs ${inventoryStatusColors[session.status]}`}
                      >
                        {inventoryStatusLabels[session.status]}
                      </span>
                    </div>
                    <h4 className="font-medium text-neutral-900">{session.name}</h4>
                    {session.description && (
                      <p className="text-sm text-neutral-500 mt-1">{session.description}</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-neutral-600">{t('resources.progress')}</span>
                    <span className="font-semibold text-neutral-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-2.5 rounded-full ${
                        progress === 100
                          ? 'bg-success-500'
                          : progress > 50
                          ? 'bg-primary-500'
                          : 'bg-warning-500'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-success-500" />
                      {session.foundCount} {t('resources.found')}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-error-500" />
                      {session.missingCount} {t('resources.notFound')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {session.totalAssets - session.foundCount - session.missingCount}{' '}
                      {t('resources.pending')}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
                  {session.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {(session.location as any).name}
                    </span>
                  )}
                  {session.startedBy && (
                    <span>
                      {t('resources.startedBy')} {(session.startedBy as any).displayName}
                    </span>
                  )}
                  {session.startedAt && (
                    <span>
                      {formatDistanceToNow(new Date(session.startedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
