import { useState } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, ChevronRight, Pencil, Save, X as XIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EvaluationSection } from './EvaluationSection';
import { EvaluationDecisionActions } from './EvaluationDecisionActions';
import { useUpdateEvaluation } from '@/hooks/useEvaluations';
import type { ExperienceEvaluation } from '@/types/crm';
import { useAuthStore } from '@/stores/authStore';

interface EvaluationCardProps {
  evaluation: ExperienceEvaluation;
}

const decisionConfig = {
  PENDING: { label: 'Pendente', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Aprovado', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejeitado', icon: XCircle, className: 'bg-red-100 text-red-800' },
};

const EDITABLE_FIELDS = ['behavior', 'english', 'interactionWithKids', 'mathPlacement', 'englishPlacement', 'additionalNotes'] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

const FIELD_LABELS: Record<EditableField, string> = {
  behavior: 'Comportamento',
  english: 'Inglês',
  interactionWithKids: 'Interação com Crianças',
  mathPlacement: 'Nivelamento - Matemática',
  englishPlacement: 'Nivelamento - Inglês',
  additionalNotes: 'Notas Adicionais',
};

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const { user, hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const canEditThis = canEdit || evaluation.evaluatedById === user?.id;

  const config = decisionConfig[evaluation.decision];
  const Icon = config.icon;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<EditableField, string>>(() => buildDraft(evaluation));

  const updateMutation = useUpdateEvaluation();

  function buildDraft(ev: ExperienceEvaluation): Record<EditableField, string> {
    return {
      behavior: ev.behavior || '',
      english: ev.english || '',
      interactionWithKids: ev.interactionWithKids || '',
      mathPlacement: ev.mathPlacement || '',
      englishPlacement: ev.englishPlacement || '',
      additionalNotes: ev.additionalNotes || '',
    };
  }

  const handleStartEdit = () => {
    setDraft(buildDraft(evaluation));
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    const data: Record<string, string | undefined> = {};
    for (const field of EDITABLE_FIELDS) {
      data[field] = draft[field].trim() || undefined;
    }
    updateMutation.mutate(
      { id: evaluation.id, leadId: evaluation.leadId, data },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const handleDraftChange = (field: EditableField) => (value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  // Fields to show: in edit mode show all, in read-only show only the 5 main + additionalNotes if present
  const visibleFields = isEditing
    ? EDITABLE_FIELDS
    : EDITABLE_FIELDS.filter((f) => f !== 'additionalNotes' || evaluation[f]);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header — clickable to expand/collapse */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200 cursor-pointer select-none"
        onClick={() => !isEditing && setIsExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <span className="font-medium text-sm">{evaluation.child?.fullName || 'Criança'}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${config.className}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {evaluation.teacherName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(evaluation.evaluationDate).toLocaleDateString('pt-BR')}
          </span>
          {canEditThis && !isEditing && (
            <button
              onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}
              className="p-1 rounded hover:bg-neutral-200 transition-colors"
              title="Editar avaliação"
            >
              <Pencil className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Evaluation sections */}
            <div className="p-4 space-y-3">
              {visibleFields.map((field) => (
                <EvaluationSection
                  key={field}
                  label={FIELD_LABELS[field]}
                  name={field}
                  value={isEditing ? draft[field] : evaluation[field]}
                  readOnly={!isEditing}
                  onChange={isEditing ? handleDraftChange(field) : undefined}
                />
              ))}

              {/* Decision notes — read-only, hidden during edit */}
              {evaluation.decisionNotes && !isEditing && (
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Notas da decisão:</p>
                  <p className="text-sm text-neutral-700">{evaluation.decisionNotes}</p>
                  {evaluation.decisionBy && (
                    <p className="text-xs text-neutral-400 mt-1">
                      Por {evaluation.decisionBy.displayName} em{' '}
                      {evaluation.decisionAt
                        ? new Date(evaluation.decisionAt).toLocaleDateString('pt-BR')
                        : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Last edit info */}
              {evaluation.lastEditedBy && !isEditing && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                  <Pencil className="w-3 h-3" />
                  <span>
                    Editado por {evaluation.lastEditedBy.displayName} em{' '}
                    {evaluation.lastEditedAt
                      ? new Date(evaluation.lastEditedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Edit actions bar */}
            {isEditing && (
              <div className="flex items-center justify-end gap-2 px-4 pb-4">
                <button
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0aacce] text-white rounded-lg hover:bg-[#089bb8] transition-colors disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Salvar
                </button>
              </div>
            )}

            {/* Decision actions — only when PENDING, not editing */}
            {evaluation.decision === 'PENDING' && canEdit && !isEditing && (
              <div className="px-4 pb-4">
                <EvaluationDecisionActions evaluationId={evaluation.id} leadId={evaluation.leadId} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
