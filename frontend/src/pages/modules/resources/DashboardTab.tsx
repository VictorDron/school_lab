import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Wrench,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Activity,
  User,
  Bell,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar } from '@/components/ui/Avatar';
import { PurchaseStatusBadge } from '@/components/procurement/PurchaseStatusBadge';
import { tabVariants, fmt } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardTabProps {
  assetStats: { total: number; available: number; inUse: number; maintenance: number } | undefined;
  purchaseStats: { pending: number; totalSpent: number } | undefined;
  purchases: any[];
  upcomingMaintenance: any[];
  overdueMaintenance: any[];
  overdueCount: number;
  pendingPurchases: number;
  onAssetClick: (id: string) => void;
  onPurchaseClick: (id: string) => void;
  onSwitchTab: (tab: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTab({
  assetStats,
  purchaseStats,
  purchases,
  upcomingMaintenance,
  overdueMaintenance,
  overdueCount,
  pendingPurchases,
  onAssetClick,
  onPurchaseClick,
  onSwitchTab,
}: DashboardTabProps) {
  const { t } = useLanguageStore();

  return (
    <motion.div
      key="dashboard"
      variants={tabVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Top row: 6 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Assets */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neutral-100">
              <Package className="w-5 h-5 text-neutral-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-neutral-900">{assetStats?.total || 0}</p>
              <p className="text-xs text-neutral-500 truncate">{t('resources.totalAssets')}</p>
            </div>
          </div>
        </div>

        {/* Available */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success-50">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-success-700">{assetStats?.available || 0}</p>
              <p className="text-xs text-neutral-500 truncate">{t('resources.available')}</p>
            </div>
          </div>
        </div>

        {/* In Use */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-primary-700">{assetStats?.inUse || 0}</p>
              <p className="text-xs text-neutral-500 truncate">{t('resources.inUse')}</p>
            </div>
          </div>
        </div>

        {/* In Maintenance */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning-50">
              <Wrench className="w-5 h-5 text-warning-600" />
            </div>
            <div className="min-w-0 flex items-end gap-1.5">
              <div>
                <p className="text-2xl font-bold text-warning-700">{assetStats?.maintenance || 0}</p>
                <p className="text-xs text-neutral-500 truncate">{t('resources.inMaintenance')}</p>
              </div>
              {overdueCount > 0 && (
                <span className="mb-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-error-100 text-error-700 text-[10px] font-semibold">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {overdueCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pending Purchases */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-orange-700">{pendingPurchases}</p>
              <p className="text-xs text-neutral-500 truncate">{t('resources.pendingPurchases')}</p>
            </div>
          </div>
        </div>

        {/* Total Spent */}
        <div className="card p-4 hover:shadow-medium transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-emerald-700 truncate">
                {fmt(purchaseStats?.totalSpent || 0)}
              </p>
              <p className="text-xs text-neutral-500 truncate">{t('resources.totalSpent')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Alerts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts card */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-warning-600" />
            <h3 className="text-base font-semibold text-neutral-900">{t('resources.alerts')}</h3>
            {(overdueCount > 0) && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-error-100 text-error-700 text-xs font-semibold">
                {overdueCount}
              </span>
            )}
          </div>
          <div className="p-5">
            {overdueCount === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-success-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{t('resources.noAlerts')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueMaintenance.slice(0, 4).map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (m.asset?.id) {
                        onAssetClick(m.asset.id);
                        onSwitchTab('assets');
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-error-50 border border-error-100 cursor-pointer hover:bg-error-100 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-error-100">
                      <AlertTriangle className="w-4 h-4 text-error-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-error-900 truncate">
                        {m.asset?.name} - {m.description}
                      </p>
                      <p className="text-xs text-error-600">
                        {m.scheduledDate
                          ? formatDistanceToNow(new Date(m.scheduledDate), { addSuffix: true, locale: ptBR })
                          : t('resources.overdue')}
                      </p>
                    </div>
                  </div>
                ))}
                {overdueCount > 4 && (
                  <button
                    onClick={() => onSwitchTab('maintenance')}
                    className="w-full text-center text-sm text-error-600 hover:text-error-700 font-medium py-2"
                  >
                    {t('resources.viewAll')} ({overdueCount})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity card */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-primary-600" />
            <h3 className="text-base font-semibold text-neutral-900">{t('resources.recentActivity')}</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {purchases.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">{t('resources.noPurchases')}</p>
              </div>
            ) : (
              purchases.slice(0, 5).map((purchase) => (
                <div
                  key={purchase.id}
                  onClick={() => onPurchaseClick(purchase.id)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <Avatar
                    src={(purchase as any).creator?.avatarUrl}
                    name={(purchase as any).creator?.displayName || ''}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{purchase.title}</p>
                    <p className="text-xs text-neutral-500">
                      {purchase.code} &middot; {purchase.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-neutral-700 hidden sm:block">
                      {fmt(Number(purchase.totalAmount))}
                    </span>
                    <PurchaseStatusBadge status={purchase.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
          {purchases.length > 5 && (
            <div className="px-5 py-3 border-t border-neutral-100">
              <button
                onClick={() => onSwitchTab('purchases')}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('resources.viewAllPurchases')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Upcoming Maintenance */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-warning-600" />
            <h3 className="text-base font-semibold text-neutral-900">
              {t('resources.upcomingMaintenance')}
            </h3>
          </div>
          {upcomingMaintenance.length > 5 && (
            <button
              onClick={() => onSwitchTab('maintenance')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('resources.viewAll')}
            </button>
          )}
        </div>
        <div className="divide-y divide-neutral-100">
          {upcomingMaintenance.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">{t('resources.noScheduledMaintenance')}</p>
            </div>
          ) : (
            upcomingMaintenance.slice(0, 5).map((m: any) => (
              <div
                key={m.id}
                onClick={() => {
                  if (m.asset?.id) onAssetClick(m.asset.id);
                }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors"
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
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-medium text-neutral-700">
                    {m.scheduledDate
                      ? format(new Date(m.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">{m.type?.toLowerCase()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
