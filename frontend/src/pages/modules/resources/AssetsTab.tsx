import { motion } from 'framer-motion';
import {
  Search,
  Package,
  QrCode,
  MapPin,
  User,
} from 'lucide-react';
import { useLanguageStore } from '@/stores/languageStore';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { statusColors, statusLabels, tabVariants, fmt } from './constants';
import type { Asset } from '@/types/assets';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssetsTabProps {
  assets: Asset[];
  isLoading: boolean;
  assetSearch: string;
  setAssetSearch: (v: string) => void;
  assetStatusFilter: string;
  setAssetStatusFilter: (v: string) => void;
  assetCategoryFilter: string;
  setAssetCategoryFilter: (v: string) => void;
  assetLocationFilter: string;
  setAssetLocationFilter: (v: string) => void;
  categories: any[];
  locations: any[];
  onAssetClick: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AssetsTab({
  assets,
  isLoading,
  assetSearch,
  setAssetSearch,
  assetStatusFilter,
  setAssetStatusFilter,
  assetCategoryFilter,
  setAssetCategoryFilter,
  assetLocationFilter,
  setAssetLocationFilter,
  categories,
  locations,
  onAssetClick,
}: AssetsTabProps) {
  const { t } = useLanguageStore();

  return (
    <motion.div
      key="assets"
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
            placeholder={t('resources.searchAssets')}
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          value={assetStatusFilter}
          onChange={(e) => setAssetStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm min-w-[140px]"
        >
          <option value="">{t('resources.allStatuses')}</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={assetCategoryFilter}
          onChange={(e) => setAssetCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm min-w-[140px]"
        >
          <option value="">{t('resources.allCategories')}</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={assetLocationFilter}
          onChange={(e) => setAssetLocationFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm min-w-[140px]"
        >
          <option value="">{t('resources.allLocations')}</option>
          {locations.map((loc: any) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <QrCode className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">{t('resources.noAssetsFound')}</p>
          <p className="text-neutral-500">{t('resources.noAssetsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onAssetClick(asset.id)}
              className="card p-4 hover:shadow-medium transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                    <QrCode className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-neutral-400">{asset.code}</span>
                    <h4 className="font-medium text-neutral-900 text-sm leading-snug">{asset.name}</h4>
                  </div>
                </div>
                <span className={`badge text-xs shrink-0 ${statusColors[asset.status]}`}>
                  {statusLabels[asset.status]}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                {asset.category && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{asset.category.name}</span>
                  </div>
                )}
                {asset.location && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{asset.location.name}</span>
                  </div>
                )}
                {asset.responsible && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{asset.responsible.displayName}</span>
                  </div>
                )}
                {asset.acquisitionValue && (
                  <p className="text-xs font-semibold text-neutral-700 mt-2 pt-2 border-t border-neutral-100">
                    {fmt(Number(asset.acquisitionValue))}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
