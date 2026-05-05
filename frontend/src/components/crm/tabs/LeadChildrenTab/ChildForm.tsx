import { Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Controller, type Control, type UseFormHandleSubmit, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { gradeOptions, type CreateChildData, type LeadChild } from '@/types/crm';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface NationalityOption {
  value: string;
  label: string;
}

interface ChildFormProps {
  editingChild: LeadChild | null;
  register: UseFormRegister<CreateChildData>;
  handleSubmit: UseFormHandleSubmit<CreateChildData>;
  control: Control<CreateChildData>;
  errors: FieldErrors<CreateChildData>;
  nationalityOptions: NationalityOption[];
  isSubmitting: boolean;
  onSubmit: (data: CreateChildData) => void;
  onCancel: () => void;
}

export function ChildForm({
  editingChild,
  register,
  handleSubmit,
  control,
  errors,
  nationalityOptions,
  isSubmitting,
  onSubmit,
  onCancel,
}: ChildFormProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4"
    >
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-neutral-900">
            {editingChild ? 'Editar Aluno' : 'Novo Aluno'}
          </h4>
          <button onClick={onCancel} className="p-1 hover:bg-neutral-200 rounded">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nome Completo *</label>
              <input
                {...register('fullName', { required: 'Nome obrigatório' })}
                className="input"
              />
              {errors.fullName && (
                <p className="text-xs text-error-500 mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Data de Nascimento *</label>
              <input
                type="date"
                {...register('dateOfBirth', { required: 'Data obrigatória' })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Gênero *</label>
              <select {...register('gender', { required: true })} className="input">
                <option value="">Selecione...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Série Desejada *</label>
              <select {...register('desiredGrade', { required: true })} className="input">
                <option value="">Selecione...</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Idioma Principal</label>
              <select {...register('primaryLanguage')} className="input">
                <option value="">Selecione...</option>
                <option value="Português">Português</option>
                <option value="Inglês">Inglês</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Escola Atual</label>
              <input {...register('currentSchool')} className="input" />
            </div>

            <div>
              <label className="label">Nacionalidade</label>
              <Controller
                name="nationality"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={nationalityOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Selecione..."
                    searchPlaceholder="Buscar..."
                  />
                )}
              />
            </div>

            <div className="col-span-2">
              <label className="label">Necessidades Especiais</label>
              <textarea {...register('specialNeeds')} className="input resize-none" rows={2} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingChild ? (
                'Salvar'
              ) : (
                'Adicionar'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
