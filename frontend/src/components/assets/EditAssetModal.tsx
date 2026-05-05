import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUpdateAsset, useAssetCategories, useAssetLocations } from '@/hooks/useAssets';
import type { Asset, AssetStatus } from '@/types/assets';

interface EditAssetModalProps {
  asset: Asset;
  onClose: () => void;
}

interface EditAssetFormData {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  status: AssetStatus;
  brand?: string;
  model?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  acquisitionValue?: number;
  currentValue?: number;
  warranty?: string;
  depreciationRate?: number;
  notes?: string;
}

const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'IN_USE', label: 'Em Uso' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
];

export function EditAssetModal({ asset, onClose }: EditAssetModalProps) {
  const updateMutation = useUpdateAsset();
  const { data: categoriesData } = useAssetCategories();
  const { data: locationsData } = useAssetLocations();

  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditAssetFormData>({
    defaultValues: {
      name: asset.name,
      description: asset.description || '',
      categoryId: asset.categoryId,
      locationId: asset.locationId,
      status: asset.status,
      brand: asset.brand || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      acquisitionDate: asset.acquisitionDate
        ? asset.acquisitionDate.substring(0, 10)
        : '',
      acquisitionValue: asset.acquisitionValue ?? undefined,
      currentValue: asset.currentValue ?? undefined,
      warranty: asset.warranty ? asset.warranty.substring(0, 10) : '',
      depreciationRate: asset.depreciationRate ?? undefined,
      notes: asset.notes || '',
    },
  });

  const onSubmit = (data: EditAssetFormData) => {
    const payload: Partial<EditAssetFormData> = {
      ...data,
      description: data.description || undefined,
      brand: data.brand || undefined,
      model: data.model || undefined,
      serialNumber: data.serialNumber || undefined,
      acquisitionDate: data.acquisitionDate || undefined,
      acquisitionValue: data.acquisitionValue
        ? Number(data.acquisitionValue)
        : undefined,
      currentValue: data.currentValue
        ? Number(data.currentValue)
        : undefined,
      warranty: data.warranty || undefined,
      depreciationRate: data.depreciationRate
        ? Number(data.depreciationRate)
        : undefined,
      notes: data.notes || undefined,
    };

    updateMutation.mutate(
      { id: asset.id, data: payload },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-white rounded-xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Editar Ativo</h2>
                <p className="text-sm text-white/70 truncate max-w-[280px]">
                  {asset.code} &mdash; {asset.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-6 py-5 space-y-4 overflow-y-auto flex-1"
          >
            {/* Name */}
            <div>
              <label className="label">Nome *</label>
              <input
                {...register('name', { required: 'Nome obrigatório' })}
                placeholder="Nome do ativo"
                className={`input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-error-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Descrição</label>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Descrição do ativo..."
                className="input resize-none"
              />
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Categoria *</label>
                <select
                  {...register('categoryId', { required: 'Categoria obrigatória' })}
                  className={`input ${errors.categoryId ? 'input-error' : ''}`}
                >
                  <option value="">Selecione...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-error-500 mt-1">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="label">Localização *</label>
                <select
                  {...register('locationId', { required: 'Localização obrigatória' })}
                  className={`input ${errors.locationId ? 'input-error' : ''}`}
                >
                  <option value="">Selecione...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="text-xs text-error-500 mt-1">{errors.locationId.message}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Marca</label>
                <input
                  {...register('brand')}
                  placeholder="Ex: Dell, HP..."
                  className="input"
                />
              </div>
              <div>
                <label className="label">Modelo</label>
                <input
                  {...register('model')}
                  placeholder="Ex: Latitude 5520"
                  className="input"
                />
              </div>
            </div>

            {/* Serial Number */}
            <div>
              <label className="label">Número de Série</label>
              <input
                {...register('serialNumber')}
                placeholder="Número de série do equipamento"
                className="input"
              />
            </div>

            {/* Acquisition Date & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Data de Aquisição</label>
                <input
                  type="date"
                  {...register('acquisitionDate')}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Valor de Aquisição (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('acquisitionValue', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="input"
                />
              </div>
            </div>

            {/* Current Value & Depreciation Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Valor Atual (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('currentValue', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Taxa de Depreciação (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('depreciationRate', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="input"
                />
              </div>
            </div>

            {/* Warranty */}
            <div>
              <label className="label">Garantia até</label>
              <input
                type="date"
                {...register('warranty')}
                className="input"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Observações</label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Observações adicionais..."
                className="input resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary btn-md"
              disabled={updateMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="btn btn-primary btn-md"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
