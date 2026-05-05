import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Package,
  ShoppingCart,
  Wrench,
  ClipboardCheck,
  Truck,
  Settings,
  BarChart3,
  Box,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { PurchaseDetailDrawer } from '@/components/procurement/PurchaseDetailDrawer';
import { SupplierManagement } from '@/components/procurement/SupplierManagement';
import { AssetDetailDrawer } from '@/components/assets/AssetDetailDrawer';
import { CreateAssetModal } from '@/components/assets/CreateAssetModal';
import { MoveAssetModal } from '@/components/assets/MoveAssetModal';
import { AssignResponsibleModal } from '@/components/assets/AssignResponsibleModal';
import { CreateMaintenanceModal } from '@/components/assets/CreateMaintenanceModal';
import { usePurchases, usePurchaseStats } from '@/hooks/usePurchases';
import {
  useAssets,
  useAssetStats,
  useUpcomingMaintenance,
  useOverdueMaintenance,
  useInventorySessions,
  useAssetCategories,
  useAssetLocations,
} from '@/hooks/useAssets';
import type { Asset } from '@/types/assets';
import type { PurchaseStatus } from '@/types/procurement';

// Lazy-loaded components that may not exist yet
// @ts-ignore
import { CreatePurchaseModal } from '@/components/procurement/CreatePurchaseModal';
// @ts-ignore
import { CreateInventoryModal } from '@/components/assets/CreateInventoryModal';
// @ts-ignore
import { InventoryCheckView } from '@/components/assets/InventoryCheckView';
// @ts-ignore
import { DecommissionModal } from '@/components/assets/DecommissionModal';
// @ts-ignore
import { EditAssetModal } from '@/components/assets/EditAssetModal';

import { DashboardTab } from './DashboardTab';
import { AssetsTab } from './AssetsTab';
import { PurchasesTab } from './PurchasesTab';
import { MaintenanceTab } from './MaintenanceTab';
import { InventoryTab } from './InventoryTab';
import { ConfigTab } from './ConfigTab';
import { tabVariants } from './constants';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'assets' | 'purchases' | 'maintenance' | 'inventory' | 'suppliers' | 'config';

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResourceManagementPage() {
  const { t } = useLanguageStore();
  const { isAdmin, hasModuleAccess } = useAuthStore();

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // ── Modal / drawer state ────────────────────────────────────────────────────
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [showCreateAssetModal, setShowCreateAssetModal] = useState(false);
  const [showCreatePurchaseModal, setShowCreatePurchaseModal] = useState(false);
  const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [moveAsset, setMoveAsset] = useState<Asset | null>(null);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);
  const [maintenanceAsset, setMaintenanceAsset] = useState<{ id: string; name: string } | null>(null);
  const [decommissionAsset, setDecommissionAsset] = useState<Asset | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [assetSearch, setAssetSearch] = useState('');
  const [assetStatusFilter, setAssetStatusFilter] = useState('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState('');
  const [assetLocationFilter, setAssetLocationFilter] = useState('');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('');

  // ── Permissions ─────────────────────────────────────────────────────────────
  const canEditAssets = hasModuleAccess('ASSETS', 'EDIT');
  const canAdminAssets = hasModuleAccess('ASSETS', 'ADMIN') || isAdmin();
  const canEditPurchases = hasModuleAccess('PROCUREMENT', 'EDIT');
  const canAdminPurchases = hasModuleAccess('PROCUREMENT', 'ADMIN') || isAdmin();

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: assetsData, isLoading: assetsLoading } = useAssets({
    search: assetSearch || undefined,
    status: assetStatusFilter || undefined,
    categoryId: assetCategoryFilter || undefined,
    locationId: assetLocationFilter || undefined,
  });
  const assets = (assetsData?.data || []) as Asset[];

  const { data: statsData } = useAssetStats();
  const assetStats = statsData?.data;

  const { data: purchasesData, isLoading: purchasesLoading } = usePurchases({
    search: purchaseSearch || undefined,
    status: (purchaseStatusFilter as PurchaseStatus) || undefined,
  });
  const purchases = purchasesData?.data || [];

  const { data: purchaseStatsData } = usePurchaseStats();
  const purchaseStats = purchaseStatsData?.data;

  const { data: upcomingData } = useUpcomingMaintenance();
  const upcoming = upcomingData?.data || [];

  const { data: overdueData } = useOverdueMaintenance();
  const overdue = overdueData?.data || [];

  const { data: inventoryData } = useInventorySessions();
  const sessions = (inventoryData?.data || []) as import('@/types/assets').InventorySession[];

  const { data: categoriesData } = useAssetCategories();
  const categories = categoriesData?.data || [];

  const { data: locationsData } = useAssetLocations();
  const locations = locationsData?.data || [];

  // ── Computed values ─────────────────────────────────────────────────────────
  const pendingPurchases = purchaseStats?.pending || 0;
  const overdueCount = overdue.length;

  // ── Tab definitions ─────────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    const base: Array<{ id: Tab; label: string; icon: typeof BarChart3; badge?: number }> = [
      { id: 'dashboard', label: t('resources.dashboard'), icon: BarChart3 },
      { id: 'assets', label: t('resources.assets'), icon: Package },
      { id: 'purchases', label: t('resources.purchases'), icon: ShoppingCart, badge: pendingPurchases || undefined },
      { id: 'maintenance', label: t('resources.maintenance'), icon: Wrench, badge: overdueCount || undefined },
      { id: 'inventory', label: t('resources.inventory'), icon: ClipboardCheck },
      { id: 'suppliers', label: t('resources.suppliers'), icon: Truck },
    ];
    if (canAdminAssets || canAdminPurchases) {
      base.push({ id: 'config', label: t('resources.config'), icon: Settings });
    }
    return base;
  }, [t, pendingPurchases, overdueCount, canAdminAssets, canAdminPurchases]);

  // ── Action button config ────────────────────────────────────────────────────
  const getActionButton = () => {
    switch (activeTab) {
      case 'assets':
        return canAdminAssets
          ? { label: t('resources.newAsset'), onClick: () => setShowCreateAssetModal(true) }
          : null;
      case 'purchases':
        return canEditPurchases
          ? { label: t('resources.newPurchase'), onClick: () => setShowCreatePurchaseModal(true) }
          : null;
      case 'inventory':
        return canAdminAssets
          ? { label: t('resources.newSession'), onClick: () => setShowCreateInventoryModal(true) }
          : null;
      default:
        return null;
    }
  };
  const actionBtn = getActionButton();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-neutral-50/50">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-20">
        <div className="p-4 lg:px-6 lg:pt-6 lg:pb-0">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm">
                <Box className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">
                  {t('resources.title')}
                </h1>
                <p className="text-sm text-neutral-500 hidden sm:block">
                  {t('resources.subtitle')}
                </p>
              </div>
            </div>

            {actionBtn && (
              <button
                onClick={actionBtn.onClick}
                className="btn btn-primary btn-md shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{actionBtn.label}</span>
                <span className="sm:hidden">{t('resources.new')}</span>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2.5 px-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'border-primary-500 text-primary-700'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                        tab.id === 'maintenance'
                          ? 'bg-error-500 text-white'
                          : 'bg-warning-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardTab
              assetStats={assetStats}
              purchaseStats={purchaseStats}
              purchases={purchases}
              upcomingMaintenance={upcoming}
              overdueMaintenance={overdue}
              overdueCount={overdueCount}
              pendingPurchases={pendingPurchases}
              onAssetClick={(id) => setSelectedAssetId(id)}
              onPurchaseClick={(id) => setSelectedPurchaseId(id)}
              onSwitchTab={(tab) => setActiveTab(tab as Tab)}
            />
          )}

          {activeTab === 'assets' && (
            <AssetsTab
              assets={assets}
              isLoading={assetsLoading}
              assetSearch={assetSearch}
              setAssetSearch={setAssetSearch}
              assetStatusFilter={assetStatusFilter}
              setAssetStatusFilter={setAssetStatusFilter}
              assetCategoryFilter={assetCategoryFilter}
              setAssetCategoryFilter={setAssetCategoryFilter}
              assetLocationFilter={assetLocationFilter}
              setAssetLocationFilter={setAssetLocationFilter}
              categories={categories}
              locations={locations}
              onAssetClick={(id) => setSelectedAssetId(id)}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesTab
              purchases={purchases}
              isLoading={purchasesLoading}
              purchaseSearch={purchaseSearch}
              setPurchaseSearch={setPurchaseSearch}
              purchaseStatusFilter={purchaseStatusFilter}
              setPurchaseStatusFilter={setPurchaseStatusFilter}
              onPurchaseClick={(id) => setSelectedPurchaseId(id)}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceTab
              upcomingMaintenance={upcoming}
              overdueMaintenance={overdue}
              canEditAssets={canEditAssets}
              onAssetClick={(id) => setSelectedAssetId(id)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              sessions={sessions}
              isLoading={false}
              onInventoryClick={(id) => setSelectedInventoryId(id)}
            />
          )}

          {activeTab === 'suppliers' && (
            <motion.div
              key="suppliers"
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <SupplierManagement />
            </motion.div>
          )}

          {activeTab === 'config' && (
            <ConfigTab
              canAdminAssets={canAdminAssets}
              canAdminPurchases={canAdminPurchases}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Drawers & Modals ────────────────────────────────────────────────── */}
      {selectedAssetId && (
        <AssetDetailDrawer
          assetId={selectedAssetId}
          onClose={() => setSelectedAssetId(null)}
          onMove={(id) => {
            const a = assets.find((x) => x.id === id);
            if (a) setMoveAsset(a);
          }}
          onAssign={(id) => {
            const a = assets.find((x) => x.id === id);
            if (a) setAssignAsset(a);
          }}
          onMaintenance={(id) => {
            const a = assets.find((x) => x.id === id);
            if (a) setMaintenanceAsset({ id: a.id, name: a.name });
          }}
          onDecommission={(id) => {
            const a = assets.find((x) => x.id === id);
            if (a) setDecommissionAsset(a);
          }}
          onEdit={(id) => {
            const a = assets.find((x) => x.id === id);
            if (a) setEditAsset(a);
          }}
        />
      )}

      {selectedPurchaseId && (
        <PurchaseDetailDrawer
          purchaseId={selectedPurchaseId}
          onClose={() => setSelectedPurchaseId(null)}
        />
      )}

      {showCreateAssetModal && (
        <CreateAssetModal onClose={() => setShowCreateAssetModal(false)} />
      )}

      {showCreatePurchaseModal && CreatePurchaseModal && (
        <CreatePurchaseModal onClose={() => setShowCreatePurchaseModal(false)} />
      )}

      {showCreateInventoryModal && CreateInventoryModal && (
        <CreateInventoryModal onClose={() => setShowCreateInventoryModal(false)} />
      )}

      {selectedInventoryId && InventoryCheckView && (
        <InventoryCheckView
          sessionId={selectedInventoryId}
          onClose={() => setSelectedInventoryId(null)}
        />
      )}

      {moveAsset && (
        <MoveAssetModal asset={moveAsset} onClose={() => setMoveAsset(null)} />
      )}

      {assignAsset && (
        <AssignResponsibleModal asset={assignAsset} onClose={() => setAssignAsset(null)} />
      )}

      {maintenanceAsset && (
        <CreateMaintenanceModal
          assetId={maintenanceAsset.id}
          assetName={maintenanceAsset.name}
          onClose={() => setMaintenanceAsset(null)}
        />
      )}

      {decommissionAsset && DecommissionModal && (
        <DecommissionModal asset={decommissionAsset} onClose={() => setDecommissionAsset(null)} />
      )}

      {editAsset && EditAssetModal && (
        <EditAssetModal asset={editAsset} onClose={() => setEditAsset(null)} />
      )}
    </div>
  );
}
