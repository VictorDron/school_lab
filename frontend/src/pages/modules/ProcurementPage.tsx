import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, ShoppingCart, BarChart3, Truck, Clock,
  CheckCircle, XCircle, Loader2, X, TrendingUp, DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { get, post, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { PurchaseDetailDrawer } from '@/components/procurement/PurchaseDetailDrawer';
import { ExecutePurchaseModal } from '@/components/procurement/ExecutePurchaseModal';
import { SupplierManagement } from '@/components/procurement/SupplierManagement';
import { PurchaseStatusBadge } from '@/components/procurement/PurchaseStatusBadge';
import { usePurchases, usePurchaseStats } from '@/hooks/usePurchases';
import type { PurchaseRequest, PurchaseStatus } from '@/types/procurement';

interface NewRequestForm {
  title: string;
  department: string;
  priority: string;
  justification: string;
  items: { description: string; quantity: number; unit: string; estimatedUnitPrice: number }[];
}

type Tab = 'dashboard' | 'requests' | 'suppliers';

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export default function ProcurementPage() {
  const { hasModuleAccess } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canEdit = hasModuleAccess('PROCUREMENT', 'EDIT');
  const canAdmin = hasModuleAccess('PROCUREMENT', 'ADMIN');

  // Queries
  const { data: purchasesData, isLoading } = usePurchases({
    search: searchQuery || undefined,
    status: (statusFilter as PurchaseStatus) || undefined,
  });
  const purchases = purchasesData?.data || [];

  const { data: statsData } = usePurchaseStats();
  const stats = statsData?.data;

  // Create form
  const { register, control, handleSubmit, reset, watch } = useForm<NewRequestForm>({
    defaultValues: {
      priority: 'NORMAL',
      items: [{ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const total = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.estimatedUnitPrice || 0)), 0);

  const createMutation = useMutation({
    mutationFn: (data: NewRequestForm) => post('/purchases', data),
    onSuccess: () => {
      toast.success('Requisição criada!');
      setShowNewModal(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseStats'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'requests' as Tab, label: 'Requisições', icon: ShoppingCart },
    { id: 'suppliers' as Tab, label: 'Fornecedores', icon: Truck },
  ];

  const statusLabels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING_MANAGER: 'Aguardando Gestor',
    PENDING_FINANCE: 'Aguardando Financeiro',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    PURCHASED: 'Comprado',
    CANCELLED: 'Cancelado',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-neutral-900">Compras</h1>
          {canEdit && activeTab === 'requests' && (
            <button onClick={() => setShowNewModal(true)} className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" />
              Nova Requisição
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-neutral-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Pendentes', value: stats?.pending || 0, icon: Clock, color: 'text-warning-600', bg: 'bg-warning-50' },
                { label: 'Aprovadas', value: stats?.approved || 0, icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-50' },
                { label: 'Total', value: stats?.total || 0, icon: ShoppingCart, color: 'text-primary-600', bg: 'bg-primary-50' },
                { label: 'Total Gasto', value: formatCurrency(stats?.totalSpent || 0), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', isText: true },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-neutral-900">
                          {'isText' in stat ? stat.value : stat.value}
                        </p>
                        <p className="text-sm text-neutral-500">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Requisições Recentes</h3>
              <div className="space-y-3">
                {purchases.slice(0, 5).map((purchase) => (
                  <div
                    key={purchase.id}
                    onClick={() => setSelectedPurchaseId(purchase.id)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={(purchase as any).creator?.avatarUrl} name={(purchase as any).creator?.displayName || ''} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{purchase.title}</p>
                        <p className="text-xs text-neutral-500">{purchase.code} • {purchase.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-neutral-900">
                        {formatCurrency(Number(purchase.totalAmount))}
                      </span>
                      <PurchaseStatusBadge status={purchase.status} size="sm" />
                    </div>
                  </div>
                ))}
                {purchases.length === 0 && (
                  <p className="text-center text-sm text-neutral-500 py-4">Nenhuma requisição ainda</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar por título ou código..."
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
                <option value="">Todos os status</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-neutral-700 mb-2">Nenhuma requisição</p>
                <p className="text-neutral-500">Crie uma nova requisição de compra</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchases.map((purchase, index) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedPurchaseId(purchase.id)}
                    className="card p-4 hover:shadow-medium transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-neutral-500">{purchase.code}</span>
                          <PurchaseStatusBadge status={purchase.status} size="sm" />
                          {purchase.priority === 'URGENT' && (
                            <span className="badge bg-error-100 text-error-700 text-xs">Urgente</span>
                          )}
                          {purchase.priority === 'HIGH' && (
                            <span className="badge bg-warning-100 text-warning-700 text-xs">Alta</span>
                          )}
                        </div>
                        <h4 className="font-medium text-neutral-900">{purchase.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                          <span>{purchase.department}</span>
                          <span>•</span>
                          <span className="font-medium text-neutral-900">
                            {formatCurrency(Number(purchase.totalAmount))}
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(purchase.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Avatar src={(purchase as any).creator?.avatarUrl} name={(purchase as any).creator?.displayName || ''} size="sm" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && <SupplierManagement />}
      </div>

      {/* Detail Drawer */}
      <PurchaseDetailDrawer
        purchaseId={selectedPurchaseId}
        onClose={() => setSelectedPurchaseId(null)}
      />

      {/* New Request Modal */}
      {showNewModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowNewModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-lg font-semibold">Nova Requisição</h2>
                <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Título</label>
                    <input {...register('title', { required: true })} className="input" placeholder="Título da requisição" />
                  </div>
                  <div>
                    <label className="label">Departamento</label>
                    <select {...register('department', { required: true })} className="input">
                      <option value="">Selecione...</option>
                      <option value="IT">TI</option>
                      <option value="Admin">Administração</option>
                      <option value="Academic">Acadêmico</option>
                      <option value="Maintenance">Manutenção</option>
                      <option value="Cleaning">Limpeza</option>
                      <option value="Finance">Financeiro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Prioridade</label>
                  <div className="flex gap-2">
                    {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                      <label key={p} className="flex-1">
                        <input type="radio" {...register('priority')} value={p} className="sr-only peer" />
                        <div className="text-center py-2 px-3 rounded-lg border text-sm font-medium cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 hover:bg-neutral-50">
                          {priorityLabels[p]}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Justificativa</label>
                  <textarea {...register('justification', { required: true, minLength: 10 })} rows={3} className="input resize-none" placeholder="Justifique a necessidade..." />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Itens</label>
                    <button type="button" onClick={() => append({ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 })} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      + Adicionar Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <input {...register(`items.${index}.description`, { required: true })} className="input text-sm" placeholder="Descrição" />
                        </div>
                        <div className="w-20">
                          <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 1 })} className="input text-sm" placeholder="Qtd" />
                        </div>
                        <div className="w-20">
                          <select {...register(`items.${index}.unit`)} className="input text-sm">
                            <option value="UN">UN</option>
                            <option value="KG">KG</option>
                            <option value="L">L</option>
                            <option value="M">M</option>
                            <option value="CX">CX</option>
                            <option value="PCT">PCT</option>
                          </select>
                        </div>
                        <div className="w-28">
                          <input type="number" step="0.01" {...register(`items.${index}.estimatedUnitPrice`, { valueAsNumber: true, min: 0 })} className="input text-sm" placeholder="R$ Valor" />
                        </div>
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(index)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-3 text-lg font-semibold text-neutral-900">
                    Total: {formatCurrency(total)}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 btn btn-secondary btn-md">
                    Cancelar
                  </button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 btn btn-primary btn-md">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Requisição'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
