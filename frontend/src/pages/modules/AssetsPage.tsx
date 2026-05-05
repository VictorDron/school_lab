import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, QrCode, MapPin, User, Wrench, Package,
  BarChart3, ClipboardCheck, Settings, AlertTriangle,
  Calendar, Clock, CheckCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { get } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { AssetDetailDrawer } from '@/components/assets/AssetDetailDrawer';
import { CreateAssetModal } from '@/components/assets/CreateAssetModal';
import { MoveAssetModal } from '@/components/assets/MoveAssetModal';
import { AssignResponsibleModal } from '@/components/assets/AssignResponsibleModal';
import { CreateMaintenanceModal } from '@/components/assets/CreateMaintenanceModal';
import { CategoryLocationManager } from '@/components/assets/CategoryLocationManager';
import { useAssets, useAssetStats, useUpcomingMaintenance, useOverdueMaintenance, useInventorySessions } from '@/hooks/useAssets';
import type { Asset, AssetStatus, InventorySession } from '@/types/assets';

type Tab = 'dashboard' | 'assets' | 'maintenance' | 'inventory' | 'config';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-success-100 text-success-700',
  IN_USE: 'bg-primary-100 text-primary-700',
  MAINTENANCE: 'bg-warning-100 text-warning-700',
  DECOMMISSIONED: 'bg-neutral-100 text-neutral-500',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  MAINTENANCE: 'Manutenção',
  DECOMMISSIONED: 'Desativado',
};

const inventoryStatusColors: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  IN_PROGRESS: 'bg-warning-100 text-warning-700',
  COMPLETED: 'bg-success-100 text-success-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
};

const inventoryStatusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export default function AssetsPage() {
  const { isAdmin, hasModuleAccess } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [moveAsset, setMoveAsset] = useState<Asset | null>(null);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);
  const [maintenanceAsset, setMaintenanceAsset] = useState<{ id: string; name: string } | null>(null);

  const canEdit = hasModuleAccess('ASSETS', 'EDIT');

  // Queries
  const { data: assetsData, isLoading } = useAssets({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
  });
  const assets = (assetsData?.data || []) as Asset[];

  const { data: statsData } = useAssetStats();
  const stats = statsData?.data;

  const { data: upcomingData } = useUpcomingMaintenance();
  const upcoming = upcomingData?.data || [];

  const { data: overdueData } = useOverdueMaintenance();
  const overdue = overdueData?.data || [];

  const { data: inventoryData } = useInventorySessions();
  const sessions = (inventoryData?.data || []) as InventorySession[];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'assets' as Tab, label: 'Ativos', icon: Package },
    { id: 'maintenance' as Tab, label: 'Manutenção', icon: Wrench },
    { id: 'inventory' as Tab, label: 'Inventário', icon: ClipboardCheck },
    ...(isAdmin() ? [{ id: 'config' as Tab, label: 'Config', icon: Settings }] : []),
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-neutral-900">Patrimônio</h1>
          {isAdmin() && activeTab === 'assets' && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" />
              Novo Ativo
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'maintenance' && overdue.length > 0 && (
                  <span className="w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                    {overdue.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-4 lg:p-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total', value: stats?.total || 0, icon: Package, color: 'text-neutral-600', bg: 'bg-neutral-100' },
                { label: 'Disponíveis', value: stats?.available || 0, icon: QrCode, color: 'text-success-600', bg: 'bg-success-50' },
                { label: 'Em Uso', value: stats?.inUse || 0, icon: User, color: 'text-primary-600', bg: 'bg-primary-50' },
                { label: 'Manutenção', value: stats?.maintenance || 0, icon: Wrench, color: 'text-warning-600', bg: 'bg-warning-50' },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                        <p className="text-sm text-neutral-500">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alerts */}
            {(overdue.length > 0) && (
              <div className="card p-4 border-l-4 border-error-500 bg-error-50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-error-600" />
                  <h3 className="font-semibold text-error-800">Alertas</h3>
                </div>
                <ul className="space-y-1 text-sm text-error-700">
                  {overdue.length > 0 && (
                    <li>{overdue.length} manutenção(ões) atrasada(s)</li>
                  )}
                </ul>
              </div>
            )}

            {/* Upcoming Maintenance */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Próximas Manutenções</h3>
              <div className="space-y-3">
                {upcoming.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-warning-100">
                        <Wrench className="w-4 h-4 text-warning-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{m.asset?.name}</p>
                        <p className="text-xs text-neutral-500">{m.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-700">
                        {m.scheduledDate ? format(new Date(m.scheduledDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </p>
                      <p className="text-xs text-neutral-500">{m.type}</p>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <p className="text-center text-sm text-neutral-500 py-4">Nenhuma manutenção agendada</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou nº série..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-12">
                <QrCode className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum ativo encontrado</p>
                <p className="text-neutral-500">Cadastre ativos para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="card p-4 hover:shadow-medium transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <span className="text-xs font-mono text-neutral-500">{asset.code}</span>
                          <h4 className="font-medium text-neutral-900 text-sm">{asset.name}</h4>
                        </div>
                      </div>
                      <span className={`badge text-xs ${statusColors[asset.status]}`}>
                        {statusLabels[asset.status]}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      {asset.category && (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Package className="w-3.5 h-3.5" />
                          <span>{asset.category.name}</span>
                        </div>
                      )}
                      {asset.location && (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{asset.location.name}</span>
                        </div>
                      )}
                      {asset.responsible && (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <User className="w-3.5 h-3.5" />
                          <span>{asset.responsible.displayName}</span>
                        </div>
                      )}
                      {asset.acquisitionValue && (
                        <p className="text-xs font-medium text-neutral-700 mt-2">
                          {formatCurrency(Number(asset.acquisitionValue))}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="p-4 lg:p-6 space-y-6">
            {/* Overdue Alert */}
            {overdue.length > 0 && (
              <div className="card p-4 border-l-4 border-error-500">
                <h3 className="font-semibold text-error-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Manutenções Atrasadas ({overdue.length})
                </h3>
                <div className="space-y-2">
                  {overdue.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-error-50">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{m.asset?.name} ({m.asset?.code})</p>
                        <p className="text-xs text-neutral-600">{m.description}</p>
                      </div>
                      <span className="text-xs text-error-600 font-medium">
                        {m.scheduledDate ? formatDistanceToNow(new Date(m.scheduledDate), { addSuffix: true, locale: ptBR }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Manutenções Agendadas</h3>
                {canEdit && (
                  <span className="text-sm text-neutral-500">
                    Selecione um ativo para agendar manutenção
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {upcoming.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        m.type === 'CORRECTIVE' ? 'bg-error-100' :
                        m.type === 'PREVENTIVE' ? 'bg-primary-100' :
                        'bg-warning-100'
                      }`}>
                        <Wrench className={`w-4 h-4 ${
                          m.type === 'CORRECTIVE' ? 'text-error-600' :
                          m.type === 'PREVENTIVE' ? 'text-primary-600' :
                          'text-warning-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{m.asset?.name}</p>
                        <p className="text-xs text-neutral-500">{m.description}</p>
                        {m.vendor && <p className="text-xs text-neutral-400">Fornecedor: {m.vendor}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {m.scheduledDate ? format(new Date(m.scheduledDate), 'dd/MM/yyyy') : '-'}
                      </p>
                      <span className={`badge text-xs ${
                        m.status === 'SCHEDULED' ? 'bg-primary-100 text-primary-700' :
                        m.status === 'IN_PROGRESS' ? 'bg-warning-100 text-warning-700' :
                        m.status === 'OVERDUE' ? 'bg-error-100 text-error-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <p className="text-center text-sm text-neutral-500 py-8">Nenhuma manutenção agendada nos próximos 30 dias</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="p-4 lg:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Sessões de Inventário</h3>
              {isAdmin() && (
                <button className="btn btn-primary btn-md">
                  <Plus className="w-4 h-4" />
                  Nova Sessão
                </button>
              )}
            </div>

            <div className="space-y-3">
              {sessions.map((session) => {
                const progress = session.totalAssets > 0
                  ? Math.round(((session.foundCount + session.missingCount) / session.totalAssets) * 100)
                  : 0;

                return (
                  <div key={session.id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-neutral-500">{session.code}</span>
                          <span className={`badge text-xs ${inventoryStatusColors[session.status]}`}>
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
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-neutral-600">Progresso</span>
                        <span className="font-medium text-neutral-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="bg-primary-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-success-500" />
                          {session.foundCount} encontrados
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-error-500" />
                          {session.missingCount} não encontrados
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {session.totalAssets - session.foundCount - session.missingCount} pendentes
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      {session.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {(session.location as any).name}
                        </span>
                      )}
                      {session.startedBy && (
                        <span>Iniciado por {(session.startedBy as any).displayName}</span>
                      )}
                      {session.startedAt && (
                        <span>{formatDistanceToNow(new Date(session.startedAt), { addSuffix: true, locale: ptBR })}</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardCheck className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum inventário</p>
                  <p className="text-neutral-500">Crie uma sessão de inventário para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && <CategoryLocationManager />}
      </div>

      {/* Detail Drawer */}
      <AssetDetailDrawer
        assetId={selectedAssetId}
        onClose={() => setSelectedAssetId(null)}
        onMove={(id) => {
          const asset = assets.find((a) => a.id === id);
          if (asset) setMoveAsset(asset);
        }}
        onAssign={(id) => {
          const asset = assets.find((a) => a.id === id);
          if (asset) setAssignAsset(asset);
        }}
        onMaintenance={(id) => {
          const asset = assets.find((a) => a.id === id);
          if (asset) setMaintenanceAsset({ id: asset.id, name: asset.name });
        }}
        onDecommission={() => {}}
      />

      {/* Modals */}
      {showCreateModal && <CreateAssetModal onClose={() => setShowCreateModal(false)} />}
      {moveAsset && <MoveAssetModal asset={moveAsset} onClose={() => setMoveAsset(null)} />}
      {assignAsset && <AssignResponsibleModal asset={assignAsset} onClose={() => setAssignAsset(null)} />}
      {maintenanceAsset && (
        <CreateMaintenanceModal
          assetId={maintenanceAsset.id}
          assetName={maintenanceAsset.name}
          onClose={() => setMaintenanceAsset(null)}
        />
      )}
    </div>
  );
}
