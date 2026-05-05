import { Loader2, Package, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreateSupplier } from '@/hooks/usePurchases';
import type { Supplier } from '@/types/procurement';
import type { NewSupplierFormFields } from './types';

interface SupplierSelectorProps {
  suppliers: Supplier[];
  loadingSuppliers: boolean;
  supplierId: string;
  setSupplierId: (id: string) => void;
  showNewSupplier: boolean;
  setShowNewSupplier: (value: boolean) => void;
}

export function SupplierSelector({
  suppliers,
  loadingSuppliers,
  supplierId,
  setSupplierId,
  showNewSupplier,
  setShowNewSupplier,
}: SupplierSelectorProps) {
  const createSupplierMutation = useCreateSupplier();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewSupplierFormFields>();

  const handleCreateSupplier = (data: NewSupplierFormFields) => {
    createSupplierMutation.mutate(
      {
        name: data.name,
        cnpj: data.cnpj || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
      },
      {
        onSuccess: (response) => {
          const created = response.data as Supplier;
          setSupplierId(created.id);
          setShowNewSupplier(false);
          reset();
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <Package className="w-4 h-4 text-primary-500" />
        <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Fornecedor
        </span>
      </div>

      {!showNewSupplier ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="input"
              disabled={loadingSuppliers}
            >
              <option value="">
                {loadingSuppliers ? 'Carregando...' : 'Selecione o fornecedor...'}
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.cnpj ? ` (${s.cnpj})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewSupplier(true)}
            className="btn btn-secondary btn-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>
      ) : (
        <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Novo Fornecedor</span>
            <button
              type="button"
              onClick={() => {
                setShowNewSupplier(false);
                reset();
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="email@exemplo.com"
                className="input"
              />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input
                {...register('phone')}
                placeholder="(00) 00000-0000"
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit(handleCreateSupplier)}
              disabled={createSupplierMutation.isPending}
              className="btn btn-primary btn-sm"
            >
              {createSupplierMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Criando...
                </>
              ) : (
                'Criar Fornecedor'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
