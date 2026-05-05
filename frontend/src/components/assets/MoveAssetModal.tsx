import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ArrowRightLeft, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMoveAsset, useAssetLocations } from '@/hooks/useAssets';
import type { Asset } from '@/types/assets';

interface MoveAssetModalProps {
  asset: Asset;
  onClose: () => void;
}

interface MoveFormData {
  locationId: string;
  reason: string;
}

export function MoveAssetModal({ asset, onClose }: MoveAssetModalProps) {
  const moveMutation = useMoveAsset();
  const { data: locationsData } = useAssetLocations();

  const locations = (locationsData?.data || []).filter(
    (loc) => loc.id !== asset.locationId
  );

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
  } = useForm<MoveFormData>();

  const onSubmit = (data: MoveFormData) => {
    moveMutation.mutate(
      {
        id: asset.id,
        locationId: data.locationId,
        reason: data.reason || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
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
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
                <ArrowRightLeft className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Movimentar Ativo</h2>
                <p className="text-sm text-white/70 truncate max-w-[280px]">{asset.name}</p>
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
            {/* Current Location */}
            <div>
              <label className="label">Localização Atual</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-600">
                <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span>{asset.location?.name || 'Sem localização'}</span>
              </div>
            </div>

            {/* New Location */}
            <div>
              <label className="label">Nova Localização *</label>
              <select
                {...register('locationId', { required: 'Selecione a nova localização' })}
                className={`input ${errors.locationId ? 'input-error' : ''}`}
              >
                <option value="">Selecione...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.parent ? `${loc.parent.name} > ` : ''}
                    {loc.name}
                  </option>
                ))}
              </select>
              {errors.locationId && (
                <p className="text-xs text-error-500 mt-1">{errors.locationId.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="label">Motivo</label>
              <textarea
                {...register('reason')}
                rows={3}
                placeholder="Motivo da movimentação..."
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
              disabled={moveMutation.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={moveMutation.isPending}
              className="btn btn-primary btn-md"
            >
              {moveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Movendo...
                </>
              ) : (
                'Movimentar'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
