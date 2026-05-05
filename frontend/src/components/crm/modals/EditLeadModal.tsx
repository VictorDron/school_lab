import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUpdateLead } from '@/hooks/useLeads';
import { sourceConfig, gradeOptions, type Lead, type UpdateLeadData, type LeadSource } from '@/types/crm';

interface EditLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLeadModal({ lead, isOpen, onClose }: EditLeadModalProps) {
  const updateMutation = useUpdateLead();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateLeadData>();

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      reset({
        familyName: lead.familyName,
        primaryContactName: lead.primaryContactName,
        primaryContactEmail: lead.primaryContactEmail,
        primaryContactPhone: lead.primaryContactPhone || '',
        numberOfChildren: lead.numberOfChildren,
        desiredGrades: lead.desiredGrades,
        source: lead.source,
        notes: lead.notes || '',
        hasSiblingsAtSchool: lead.hasSiblingsAtSchool || false,
      });
    }
  }, [lead, reset]);

  const onSubmit = (data: UpdateLeadData) => {
    if (!lead) return;

    updateMutation.mutate(
      { id: lead.id, data },
      {
        onSuccess: () => {
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
    <AnimatePresence>
      {isOpen && lead && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Editar Lead</h2>
                  <p className="text-sm text-neutral-500">{lead.code}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {/* Family Name */}
                <div>
                  <label className="label">Nome da Família *</label>
                  <input
                    {...register('familyName', { required: 'Nome obrigatório' })}
                    className="input"
                  />
                  {errors.familyName && (
                    <p className="text-xs text-error-500 mt-1">{errors.familyName.message}</p>
                  )}
                </div>

                {/* Contact Name */}
                <div>
                  <label className="label">Nome do Contato *</label>
                  <input
                    {...register('primaryContactName', { required: 'Nome obrigatório' })}
                    className="input"
                  />
                  {errors.primaryContactName && (
                    <p className="text-xs text-error-500 mt-1">{errors.primaryContactName.message}</p>
                  )}
                </div>

                {/* Contact Email */}
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    {...register('primaryContactEmail', {
                      required: 'Email obrigatório',
                      pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
                    })}
                    className="input"
                  />
                  {errors.primaryContactEmail && (
                    <p className="text-xs text-error-500 mt-1">{errors.primaryContactEmail.message}</p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="label">Telefone</label>
                  <input
                    {...register('primaryContactPhone')}
                    className="input"
                  />
                </div>

                {/* Number of Children */}
                <div>
                  <label className="label">Número de Filhos</label>
                  <select {...register('numberOfChildren', { valueAsNumber: true })} className="input">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desired Grade */}
                <div>
                  <label className="label">Série Desejada</label>
                  <select {...register('desiredGrades.0')} className="input">
                    <option value="">Selecione...</option>
                    {gradeOptions.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div>
                  <label className="label">Origem</label>
                  <select {...register('source')} className="input">
                    {(Object.keys(sourceConfig) as LeadSource[]).map((source) => (
                      <option key={source} value={source}>
                        {sourceConfig[source].label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Has Siblings */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasSiblingsAtSchool"
                    {...register('hasSiblingsAtSchool')}
                    className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="hasSiblingsAtSchool" className="text-sm text-neutral-700">
                    Possui irmãos na escola
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="label">Observações</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
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
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
