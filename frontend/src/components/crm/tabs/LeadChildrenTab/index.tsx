import { AnimatePresence } from 'framer-motion';
import { Plus, User, School, MapPin } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { useLeadChildrenTab } from './useLeadChildrenTab';
import { ChildForm } from './ChildForm';
import { ChildCard } from './ChildCard';

interface LeadChildrenTabProps {
  lead: Lead;
  canEdit: boolean;
}

export function LeadChildrenTab({ lead, canEdit }: LeadChildrenTabProps) {
  const state = useLeadChildrenTab({ lead });
  const { derived, ui, setters, form, handlers, mutations } = state;
  const { children, educationHistory, nationalityOptions, getChildEducationHistory } = derived;
  const { showForm, editingChild } = ui;
  const { setShowForm } = setters;
  const { register, handleSubmit, control, formState: { errors } } = form;
  const { onSubmit, handleCancel } = handlers;
  const { add: addMutation, update: updateMutation } = mutations;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
          Alunos ({children.length})
        </h3>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <ChildForm
            editingChild={editingChild}
            register={register}
            handleSubmit={handleSubmit}
            control={control}
            errors={errors}
            nationalityOptions={nationalityOptions}
            isSubmitting={addMutation.isPending || updateMutation.isPending}
            onSubmit={onSubmit}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <User className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
          <p>Nenhum aluno cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              childHistory={getChildEducationHistory(child.id)}
              lead={lead}
              canEdit={canEdit}
              state={state}
            />
          ))}
        </div>
      )}

      {/* General Education History (not linked to specific child) */}
      {educationHistory.filter((edu) => !edu.childId).length > 0 && (
        <div className="mt-6 pt-4 border-t border-neutral-200">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <School className="w-4 h-4" />
            Histórico Educacional Geral
          </h3>
          <div className="space-y-2">
            {educationHistory
              .filter((edu) => !edu.childId)
              .map((edu) => (
                <div key={edu.id} className="bg-neutral-50 rounded-lg p-3 text-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">{edu.schoolName}</p>
                      {(edu.city || edu.country) && (
                        <p className="text-neutral-500 text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {[edu.city, edu.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {(edu.yearStart || edu.yearEnd) && (
                      <span className="text-xs text-neutral-500">
                        {edu.yearStart}
                        {edu.yearEnd && edu.yearEnd !== edu.yearStart ? ` - ${edu.yearEnd}` : ''}
                      </span>
                    )}
                  </div>
                  {edu.gradesAttended && (
                    <p className="text-neutral-600 text-xs mt-1">Séries: {edu.gradesAttended}</p>
                  )}
                  {edu.notes && (
                    <p className="text-neutral-500 text-xs mt-1 italic">{edu.notes}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
