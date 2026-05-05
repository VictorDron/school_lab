import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAsset } from '@/hooks/useAssets';
import { useAuthStore } from '@/stores/authStore';
import type { Asset } from '@/types/assets';
import { statusColors, statusLabels, tabs, type TabId } from './constants';
import { GeralTab } from './GeralTab';
import { ManutencaoTab } from './ManutencaoTab';
import { HistoricoTab } from './HistoricoTab';
import { ComunicacaoTab } from './ComunicacaoTab';
import { DrawerActions } from './DrawerActions';

// ── Props ──────────────────────────────────────────────────────────────────────

interface AssetDetailDrawerProps {
  assetId: string | null;
  onClose: () => void;
  onMove: (assetId: string) => void;
  onAssign: (assetId: string) => void;
  onMaintenance: (assetId: string) => void;
  onDecommission: (assetId: string) => void;
  onEdit?: (assetId: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AssetDetailDrawer({
  assetId,
  onClose,
  onMove,
  onAssign,
  onMaintenance,
  onDecommission,
  onEdit,
}: AssetDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('geral');

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('ASSETS', 'EDIT');
  const isAdmin = hasModuleAccess('ASSETS', 'ADMIN');

  const { data: assetResponse, isLoading } = useAsset(assetId ?? undefined);
  const asset = assetResponse?.data as Asset | undefined;

  // Reset tab when asset changes
  useEffect(() => {
    setActiveTab('geral');
  }, [assetId]);

  // Block body scroll when drawer is open
  useEffect(() => {
    if (assetId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [assetId]);

  const isOpen = !!assetId;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
                {asset && (
                  <div>
                    <span className="text-sm font-mono text-neutral-500">{asset.code}</span>
                    <h2 className="text-lg font-semibold text-neutral-900">{asset.name}</h2>
                  </div>
                )}
              </div>

              {asset && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                  {statusLabels[asset.status]}
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 px-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : asset ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'geral' && <GeralTab asset={asset} />}
                    {activeTab === 'manutencao' && <ManutencaoTab assetId={asset.id} />}
                    {activeTab === 'historico' && <HistoricoTab movements={asset.movements ?? []} />}
                    {activeTab === 'comunicacao' && <ComunicacaoTab />}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex items-center justify-center h-64 text-neutral-500">
                  Ativo não encontrado
                </div>
              )}
            </div>

            {asset && (
              <DrawerActions
                asset={asset}
                canEdit={canEdit}
                isAdmin={isAdmin}
                onEdit={onEdit}
                onMove={onMove}
                onAssign={onAssign}
                onMaintenance={onMaintenance}
                onDecommission={onDecommission}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}



