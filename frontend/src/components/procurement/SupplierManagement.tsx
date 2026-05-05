import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Loader2,
  Building2,
  Mail,
  Phone,
  Archive,
  Edit3,
  X,
  AlertCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useArchiveSupplier,
} from '@/hooks/usePurchases';
import type { Supplier } from '@/types/procurement';

interface SupplierFormData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function SupplierManagement() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Supplier | null>(null);

  const { data: suppliersResponse, isLoading } = useSuppliers({ search: search || undefined });
  const suppliers = suppliersResponse?.data ?? [];
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const archiveMutation = useArchiveSupplier();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>();

  const openCreateForm = () => {
    setEditingSupplier(null);
    reset({ name: '', cnpj: '', email: '', phone: '', address: '', notes: '' });
    setShowForm(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      cnpj: supplier.cnpj || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    reset();
  };

  const onSubmit = (data: SupplierFormData) => {
    const payload: Partial<Supplier> = {
      name: data.name,
      cnpj: data.cnpj || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
    };

    if (editingSupplier) {
      updateMutation.mutate(
        { id: editingSupplier.id, data: payload },
        { onSuccess: () => closeForm() },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => closeForm() });
    }
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.id, {
      onSuccess: () => setArchiveTarget(null),
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fornecedores..."
            className="input pl-9"
          />
        </div>
        <button onClick={openCreateForm} className="btn btn-primary btn-md flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Novo Fornecedor
        </button>
      </div>

      {/* Inline Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-500" />
                  <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                    {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                  </h3>
                </div>
                <button
                  onClick={closeForm}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome *</label>
                    <input
                      {...register('name', { required: 'Nome obrigatório' })}
                      placeholder="Nome do fornecedor"
                      className={`input ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-error-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">CNPJ</label>
                    <input
                      {...register('cnpj')}
                      placeholder="00.000.000/0000-00"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <Mail className="w-3.5 h-3.5 inline-block mr-1 text-neutral-400" />
                      Email
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="email@exemplo.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <Phone className="w-3.5 h-3.5 inline-block mr-1 text-neutral-400" />
                      Telefone
                    </label>
                    <input
                      {...register('phone')}
                      placeholder="(00) 00000-0000"
                      className="input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Endereço</label>
                    <input
                      {...register('address')}
                      placeholder="Endereço do fornecedor"
                      className="input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Observações</label>
                    <textarea
                      {...register('notes')}
                      rows={2}
                      placeholder="Observações adicionais..."
                      className="input resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeForm} className="btn btn-secondary btn-md">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary btn-md">
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : editingSupplier ? (
                      'Salvar Alterações'
                    ) : (
                      'Criar Fornecedor'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suppliers Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">
            {search ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-left border-b border-neutral-200">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium text-center">Pedidos</th>
                <th className="px-4 py-3 font-medium text-right">Total Gasto</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-neutral-50/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-neutral-800">{supplier.name}</span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {supplier.cnpj || <span className="text-neutral-300">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {supplier.email && (
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <Phone className="w-3 h-3" />
                          <span className="text-xs">{supplier.phone}</span>
                        </div>
                      )}
                      {!supplier.email && !supplier.phone && (
                        <span className="text-neutral-300">&mdash;</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-neutral-600">
                    {supplier._count?.purchaseOrders ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right text-neutral-700 font-medium">
                    {formatCurrency(supplier._totalSpent ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        supplier.isActive
                          ? 'bg-success-50 text-success-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          supplier.isActive ? 'bg-success-400' : 'bg-neutral-400'
                        }`}
                      />
                      {supplier.isActive ? 'Ativo' : 'Arquivado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(supplier)}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {supplier.isActive && (
                        <button
                          onClick={() => setArchiveTarget(supplier)}
                          className="p-1.5 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                          title="Arquivar"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {archiveTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setArchiveTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-5 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Arquivar Fornecedor</h3>
                  <p className="text-sm text-neutral-500">
                    Tem certeza que deseja arquivar{' '}
                    <strong>{archiveTarget.name}</strong>?
                  </p>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                O fornecedor não aparecerá mais em novas compras, mas o histórico será mantido.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setArchiveTarget(null)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiveMutation.isPending}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  {archiveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Arquivar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
