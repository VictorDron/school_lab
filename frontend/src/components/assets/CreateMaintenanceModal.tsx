import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Wrench } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreateMaintenance } from '@/hooks/useAssets';
import type { CreateMaintenanceInput, MaintenanceType } from '@/types/assets';

interface CreateMaintenanceModalProps {
  assetId: string;
  assetName: string;
  onClose: () => void;
}

const typeOptions: { value: MaintenanceType; label: string }[] = [
  { value: 'PREVENTIVE', label: 'Preventiva' },
  { value: 'CORRECTIVE', label: 'Corretiva' },
  { value: 'INSPECTION', label: 'Inspeção' },
  { value: 'CALIBRATION', label: 'Calibração' },
  { value: 'CLEANING', label: 'Limpeza' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export function CreateMaintenanceModal({ assetId, assetName, onClose }: CreateMaintenanceModalProps) {
  const createMutation = useCreateMaintenance();

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
    watch,
    formState: { errors },
  } = useForm<CreateMaintenanceInput>({
    defaultValues: {
      type: 'PREVENTIVE',
      priority: 'NORMAL',
    },
  });

  const selectedType = watch('type');
  const selectedPriority = watch('priority');

  const onSubmit = (data: CreateMaintenanceInput) => {
    const payload: CreateMaintenanceInput = {
      ...data,
      cost: data.cost ? Number(data.cost) : undefined,
    };

    createMutation.mutate(
      { assetId, data: payload },
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
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Agendar Manutenção</h2>
                <p className="text-sm text-white/70 truncate max-w-[280px]">{assetName}</p>
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
            {/* Type - Radio buttons */}
            <div>
              <label className="label">Tipo *</label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                      selectedType === opt.value
                        ? 'bg-primary-50 border-primary-300 text-primary-800'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register('type', { required: 'Tipo obrigatório' })}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {errors.type && (
                <p className="text-xs text-error-500 mt-1">{errors.type.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label">Descrição *</label>
              <textarea
                {...register('description', { required: 'Descrição obrigatória' })}
                rows={3}
                placeholder="Descreva o serviço de manutenção..."
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
              />
              {errors.description && (
                <p className="text-xs text-error-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Scheduled Date */}
            <div>
              <label className="label">Data Programada</label>
              <input
                type="date"
                {...register('scheduledDate')}
                className="input"
              />
            </div>

            {/* Priority - Radio buttons */}
            <div>
              <label className="label">Prioridade</label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => {
                  const colorMap: Record<string, { active: string; idle: string }> = {
                    LOW: {
                      active: 'bg-green-50 border-green-300 text-green-800',
                      idle: 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                    },
                    NORMAL: {
                      active: 'bg-blue-50 border-blue-300 text-blue-800',
                      idle: 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                    },
                    HIGH: {
                      active: 'bg-amber-50 border-amber-300 text-amber-800',
                      idle: 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                    },
                    URGENT: {
                      active: 'bg-red-50 border-red-300 text-red-800',
                      idle: 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                    },
                  };
                  const colors = colorMap[opt.value] || colorMap.NORMAL;

                  return (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                        selectedPriority === opt.value ? colors.active : colors.idle
                      }`}
                    >
                      <input
                        type="radio"
                        value={opt.value}
                        {...register('priority')}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Vendor & Estimated Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fornecedor</label>
                <input
                  {...register('vendor')}
                  placeholder="Nome do fornecedor"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Custo Estimado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('cost', { valueAsNumber: true })}
                  placeholder="0,00"
                  className="input"
                />
              </div>
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
                  Agendando...
                </>
              ) : (
                'Agendar Manutenção'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
