import { motion } from 'framer-motion';
import {
  Wrench,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguageStore } from '@/stores/languageStore';
import { tabVariants } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MaintenanceTabProps {
  upcomingMaintenance: any[];
  overdueMaintenance: any[];
  canEditAssets: boolean;
  onAssetClick: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MaintenanceTab({
  upcomingMaintenance,
  overdueMaintenance,
  canEditAssets,
  onAssetClick,
}: MaintenanceTabProps) {
  const { t } = useLanguageStore();

  return (
    <motion.div
      key="maintenance"
      variants={tabVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Overdue Section */}
      {overdueMaintenance.length > 0 && (
        <div className="card overflow-hidden border-l-4 border-error-500">
          <div className="px-5 py-4 bg-error-50 border-b border-error-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error-600" />
            <h3 className="font-semibold text-error-800">
              {t('resources.overdueMaintenance')} ({overdueMaintenance.length})
            </h3>
          </div>
          <div className="divide-y divide-error-100">
            {overdueMaintenance.map((m: any) => (
              <div
                key={m.id}
                onClick={() => {
                  if (m.asset?.id) onAssetClick(m.asset.id);
                }}
                className="flex items-center justify-between px-5 py-4 hover:bg-error-50/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-error-100">
                    <AlertTriangle className="w-4 h-4 text-error-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {m.asset?.name}{' '}
                      <span className="text-neutral-500 font-normal">({m.asset?.code})</span>
                    </p>
                    <p className="text-xs text-neutral-600">{m.description}</p>
                    {m.vendor && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t('resources.vendor')}: {m.vendor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-xs text-error-600 font-semibold">
                    {m.scheduledDate
                      ? formatDistanceToNow(new Date(m.scheduledDate), {
                          addSuffix: true,
                          locale: ptBR,
                        })
                      : ''}
                  </span>
                  <p className="text-xs text-neutral-500 capitalize mt-0.5">{m.type?.toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Section */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-base font-semibold text-neutral-900">
              {t('resources.scheduledMaintenance')}
            </h3>
          </div>
          {canEditAssets && (
            <span className="text-sm text-neutral-500">
              {t('resources.selectAssetForMaintenance')}
            </span>
          )}
        </div>
        <div className="divide-y divide-neutral-100">
          {upcomingMaintenance.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-14 h-14 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">{t('resources.noScheduledMaintenance')}</p>
            </div>
          ) : (
            upcomingMaintenance.map((m: any) => (
              <div
                key={m.id}
                onClick={() => {
                  if (m.asset?.id) onAssetClick(m.asset.id);
                }}
                className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      m.type === 'CORRECTIVE'
                        ? 'bg-error-100'
                        : m.type === 'PREVENTIVE'
                        ? 'bg-primary-100'
                        : 'bg-warning-100'
                    }`}
                  >
                    <Wrench
                      className={`w-4 h-4 ${
                        m.type === 'CORRECTIVE'
                          ? 'text-error-600'
                          : m.type === 'PREVENTIVE'
                          ? 'text-primary-600'
                          : 'text-warning-600'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{m.asset?.name}</p>
                    <p className="text-xs text-neutral-500">{m.description}</p>
                    {m.vendor && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {t('resources.vendor')}: {m.vendor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-neutral-700">
                    {m.scheduledDate
                      ? format(new Date(m.scheduledDate), 'dd/MM/yyyy')
                      : '-'}
                  </p>
                  <span
                    className={`badge text-xs ${
                      m.status === 'SCHEDULED'
                        ? 'bg-primary-100 text-primary-700'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-warning-100 text-warning-700'
                        : m.status === 'OVERDUE'
                        ? 'bg-error-100 text-error-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
