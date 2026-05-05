import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ClipboardList, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreateInventory, useAssetCategories, useAssetLocations } from '@/hooks/useAssets';
import type { CreateInventoryInput } from '@/types/assets';

interface CreateInventoryModalProps {
  onClose: () => void;
}

export function CreateInventoryModal({ onClose }: CreateInventoryModalProps) {
  const createMutation = useCreateInventory();
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
  } = useForm<CreateInventoryInput>({
    defaultValues: {
      name: '',
      description: '',
      locationId: '',
      categoryId: '',
    },
  });

  const onSubmit = (data: CreateInventoryInput) => {
    const payload: CreateInventoryInput = {
      name: data.name,
      description: data.description || undefined,
      locationId: data.locationId || undefined,
      categoryId: data.categoryId || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
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
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Nova Sessão de Inventário</h2>
                <p className="text-sm text-white/70">Configure os filtros e inicie a contagem</p>
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
                placeholder="Ex: Inventário Semestral 2026"
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
                rows={3}
                placeholder="Descrição da sessão de inventário..."
                className="input resize-none"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="label">Localização</label>
              <select {...register('locationId')} className="input">
                <option value="">Todos</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="label">Categoria</label>
              <select {...register('categoryId')} className="input">
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Info text */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-primary-700">
                Os ativos que correspondem aos filtros serão incluídos automaticamente na sessão.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary btn-md"
              disabled={createMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending}
              className="btn btn-primary btn-md"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Sessão'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
