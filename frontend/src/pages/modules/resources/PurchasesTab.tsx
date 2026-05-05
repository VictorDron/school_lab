import { motion } from 'framer-motion';
import {
  Search,
  ShoppingCart,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguageStore } from '@/stores/languageStore';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { Avatar } from '@/components/ui/Avatar';
import { PurchaseStatusBadge } from '@/components/procurement/PurchaseStatusBadge';
import { purchaseStatusLabels, tabVariants, fmt } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchasesTabProps {
  purchases: any[];
  isLoading: boolean;
  purchaseSearch: string;
  setPurchaseSearch: (v: string) => void;
  purchaseStatusFilter: string;
  setPurchaseStatusFilter: (v: string) => void;
  onPurchaseClick: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PurchasesTab({
  purchases,
  isLoading,
  purchaseSearch,
  setPurchaseSearch,
  purchaseStatusFilter,
  setPurchaseStatusFilter,
  onPurchaseClick,
}: PurchasesTabProps) {
  const { t } = useLanguageStore();

  return (
    <motion.div
      key="purchases"
      variants={tabVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="p-4 lg:p-6"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder={t('resources.searchPurchases')}
            value={purchaseSearch}
            onChange={(e) => setPurchaseSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={purchaseStatusFilter}
          onChange={(e) => setPurchaseStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm min-w-[180px]"
        >
          <option value="">{t('resources.allStatuses')}</option>
          {Object.entries(purchaseStatusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">{t('resources.noPurchases')}</p>
          <p className="text-neutral-500">{t('resources.noPurchasesHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase, index) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onPurchaseClick(purchase.id)}
              className="card p-4 hover:shadow-medium transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-neutral-400">{purchase.code}</span>
                    <PurchaseStatusBadge status={purchase.status} size="sm" />
                    {purchase.priority === 'URGENT' && (
                      <span className="badge bg-error-100 text-error-700 text-xs">
                        {t('resources.urgent')}
                      </span>
                    )}
                    {purchase.priority === 'HIGH' && (
                      <span className="badge bg-warning-100 text-warning-700 text-xs">
                        {t('resources.high')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-neutral-900">{purchase.title}</h4>
                  <div className="flex items-center gap-3 mt-2 text-sm text-neutral-500 flex-wrap">
                    <span>{purchase.department}</span>
                    <span className="text-neutral-300">&middot;</span>
                    <span className="font-medium text-neutral-900">
                      {fmt(Number(purchase.totalAmount))}
                    </span>
                    <span className="text-neutral-300">&middot;</span>
                    <span>
                      {formatDistanceToNow(new Date(purchase.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>
                <Avatar
                  src={(purchase as any).creator?.avatarUrl}
                  name={(purchase as any).creator?.displayName || ''}
                  size="sm"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
