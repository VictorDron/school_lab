import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useCreatePurchase } from '@/hooks/usePurchases';
import type { PurchasePriority } from '@/types/procurement';

interface CreatePurchaseModalProps {
  onClose: () => void;
}

interface PurchaseFormData {
  title: string;
  department: string;
  priority: PurchasePriority;
  justification: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice: number;
  }>;
}

const priorityOptions: { value: PurchasePriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baixa', color: 'text-neutral-600' },
  { value: 'NORMAL', label: 'Normal', color: 'text-primary-600' },
  { value: 'HIGH', label: 'Alta', color: 'text-warning-600' },
  { value: 'URGENT', label: 'Urgente', color: 'text-error-600' },
];

const unitOptions = ['UN', 'KG', 'L', 'M', 'CX', 'PCT'];

const departmentOptions = [
  'Administração',
  'Financeiro',
  'Pedagógico',
  'Tecnologia',
  'Manutenção',
  'Secretaria',
  'Recursos Humanos',
  'Marketing',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CreatePurchaseModal({ onClose }: CreatePurchaseModalProps) {
  const createMutation = useCreatePurchase();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    defaultValues: {
      title: '',
      department: '',
      priority: 'NORMAL',
      justification: '',
      items: [{ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');

  const runningTotal = useMemo(
    () =>
      (watchedItems || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.estimatedUnitPrice) || 0),
        0,
      ),
    [watchedItems],
  );

  const onSubmit = (data: PurchaseFormData) => {
    const payload = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        estimatedUnitPrice: Number(item.estimatedUnitPrice),
      })),
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
          className="bg-white rounded-xl shadow-large w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Nova Requisição de Compra</h2>
                <p className="text-sm text-white/70">Preencha os dados da solicitação</p>
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
            className="px-6 py-5 space-y-5 overflow-y-auto flex-1"
          >
            {/* Title */}
            <div>
              <label className="label">Título *</label>
              <input
                {...register('title', { required: 'Título obrigatório' })}
                placeholder="Ex: Material de escritório para março"
                className={`input ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && (
                <p className="text-xs text-error-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="label">Departamento *</label>
              <select
                {...register('department', { required: 'Departamento obrigatório' })}
                className={`input ${errors.department ? 'input-error' : ''}`}
              >
                <option value="">Selecione...</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-xs text-error-500 mt-1">{errors.department.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="label">Prioridade *</label>
              <div className="flex gap-3 flex-wrap">
                {priorityOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register('priority', { required: 'Prioridade obrigatória' })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className={`text-sm font-medium ${opt.color}`}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {errors.priority && (
                <p className="text-xs text-error-500 mt-1">{errors.priority.message}</p>
              )}
            </div>

            {/* Justification */}
            <div>
              <label className="label">Justificativa *</label>
              <textarea
                {...register('justification', {
                  required: 'Justificativa obrigatória',
                  minLength: {
                    value: 10,
                    message: 'Mínimo de 10 caracteres',
                  },
                })}
                rows={3}
                placeholder="Explique a necessidade desta compra..."
                className={`input resize-none ${errors.justification ? 'input-error' : ''}`}
              />
              {errors.justification && (
                <p className="text-xs text-error-500 mt-1">{errors.justification.message}</p>
              )}
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
                    Itens
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({ description: '', quantity: 1, unit: 'UN', estimatedUnitPrice: 0 })
                  }
                  className="btn btn-secondary btn-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Item
                </button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500 uppercase">
                      Item {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1 text-neutral-400 hover:text-error-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Descrição *</label>
                    <input
                      {...register(`items.${index}.description`, {
                        required: 'Descrição obrigatória',
                      })}
                      placeholder="Descrição do item"
                      className={`input ${errors.items?.[index]?.description ? 'input-error' : ''}`}
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-error-500 mt-1">
                        {errors.items[index].description?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="label">Quantidade *</label>
                      <input
                        type="number"
                        min={1}
                        {...register(`items.${index}.quantity`, {
                          required: 'Obrigatório',
                          valueAsNumber: true,
                          min: { value: 1, message: 'Min 1' },
                        })}
                        className={`input ${errors.items?.[index]?.quantity ? 'input-error' : ''}`}
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="label">Unidade</label>
                      <select
                        {...register(`items.${index}.unit`)}
                        className="input"
                      >
                        {unitOptions.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estimated Unit Price */}
                    <div>
                      <label className="label">Preço Unit. (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        {...register(`items.${index}.estimatedUnitPrice`, {
                          required: 'Obrigatório',
                          valueAsNumber: true,
                          min: { value: 0, message: 'Min 0' },
                        })}
                        placeholder="0,00"
                        className={`input ${errors.items?.[index]?.estimatedUnitPrice ? 'input-error' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Item subtotal */}
                  {watchedItems?.[index] && (
                    <div className="text-right text-sm text-neutral-600">
                      Subtotal:{' '}
                      <span className="font-medium text-neutral-800">
                        {formatCurrency(
                          (Number(watchedItems[index].quantity) || 0) *
                            (Number(watchedItems[index].estimatedUnitPrice) || 0),
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Running Total */}
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary-700">Total Estimado</span>
                <span className="text-lg font-semibold text-primary-800">
                  {formatCurrency(runningTotal)}
                </span>
              </div>
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
                'Criar Requisição'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
