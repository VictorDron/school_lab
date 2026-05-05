import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Loader2, X, CheckCircle, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreateEvaluation, useEventEvaluations } from '@/hooks/useEvaluations';
import { useLead } from '@/hooks/useLeads';
import { useAuthStore } from '@/stores/authStore';
import { EvaluationSection } from './EvaluationSection';

interface ExperienceEvaluationFormProps {
  eventId: string;
  leadId: string;
  onClose: () => void;
}

interface EvalFormData {
  teacherName: string;
  evaluationDate: string;
  behavior: string;
  english: string;
  interactionWithKids: string;
  mathPlacement: string;
  englishPlacement: string;
  additionalNotes: string;
}

const defaultFormValues: EvalFormData = {
  teacherName: '',
  evaluationDate: new Date().toISOString().split('T')[0],
  behavior: '',
  english: '',
  interactionWithKids: '',
  mathPlacement: '',
  englishPlacement: '',
  additionalNotes: '',
};

export function ExperienceEvaluationForm({ eventId, leadId, onClose }: ExperienceEvaluationFormProps) {
  const createMutation = useCreateEvaluation();
  const { data: leadData } = useLead(leadId);
  const { data: evalsData } = useEventEvaluations(eventId);
  const lead = leadData?.data;
  const children = lead?.children || [];
  const existingEvals = evalsData?.data || [];
  const { user } = useAuthStore();

  // Drafts: store form data per child so switching tabs preserves data
  const draftsRef = useRef<Map<string, EvalFormData>>(new Map());

  // Track which children already have evaluations (saved to server)
  const evaluatedChildIds = useMemo(
    () => new Set(existingEvals.map((e) => e.childId)),
    [existingEvals]
  );

  const pendingChildren = useMemo(
    () => children.filter((c) => !evaluatedChildIds.has(c.id)),
    [children, evaluatedChildIds]
  );

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Auto-select first pending child when data loads
  useEffect(() => {
    if (pendingChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(pendingChildren[0].id);
    }
  }, [pendingChildren, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const isAlreadyEvaluated = evaluatedChildIds.has(selectedChildId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<EvalFormData>({
    defaultValues: {
      ...defaultFormValues,
      teacherName: user?.displayName || '',
    },
  });

  // Save current form to drafts before switching
  const saveDraft = useCallback(() => {
    if (selectedChildId) {
      draftsRef.current.set(selectedChildId, { ...getValues() });
    }
  }, [selectedChildId, getValues]);

  // Switch child: save current draft, load target draft
  const handleChildSwitch = (childId: string) => {
    saveDraft();
    setSelectedChildId(childId);

    const draft = draftsRef.current.get(childId);
    if (draft) {
      reset(draft);
    } else {
      reset({ ...defaultFormValues });
    }
  };

  const onSubmit = (data: EvalFormData) => {
    if (!selectedChildId) return;

    createMutation.mutate(
      {
        eventId,
        childId: selectedChildId,
        leadId,
        teacherName: data.teacherName,
        evaluationDate: new Date(data.evaluationDate).toISOString(),
        behavior: data.behavior || undefined,
        english: data.english || undefined,
        interactionWithKids: data.interactionWithKids || undefined,
        mathPlacement: data.mathPlacement || undefined,
        englishPlacement: data.englishPlacement || undefined,
        additionalNotes: data.additionalNotes || undefined,
      },
      {
        onSuccess: () => {
          // Remove submitted child from drafts
          draftsRef.current.delete(selectedChildId);

          // Advance to next pending child or close
          const remainingAfterThis = pendingChildren.filter((c) => c.id !== selectedChildId);
          if (remainingAfterThis.length > 0) {
            const nextId = remainingAfterThis[0].id;
            setSelectedChildId(nextId);
            const draft = draftsRef.current.get(nextId);
            reset(draft ?? { ...defaultFormValues });
          } else {
            onClose();
          }
        },
      }
    );
  };

  // All children evaluated
  if (children.length > 0 && pendingChildren.length === 0) {
    return (
      <div className="border border-green-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-4 bg-green-50">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Todas as avaliações foram preenchidas</p>
            <p className="text-xs text-green-600 mt-0.5">
              {children.length} {children.length === 1 ? 'criança avaliada' : 'crianças avaliadas'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-green-100 rounded">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header with progress */}
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
        <div>
          <h3 className="text-sm font-semibold text-purple-900">Avaliação de Vivência</h3>
          {children.length > 1 && (
            <p className="text-xs text-purple-600 mt-0.5">
              {existingEvals.length} de {children.length} crianças avaliadas
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-purple-100 rounded">
          <X className="w-4 h-4 text-purple-600" />
        </button>
      </div>

      {/* Child tabs */}
      {children.length > 0 && (
        <div className="flex border-b border-neutral-200 overflow-x-auto bg-white">
          {children.map((child) => {
            const isDone = evaluatedChildIds.has(child.id);
            const isActive = child.id === selectedChildId;
            const hasDraft = draftsRef.current.has(child.id) && !isDone;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => !isDone && handleChildSwitch(child.id)}
                disabled={isDone}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isDone
                    ? 'border-transparent text-green-600 bg-green-50/50 cursor-default'
                    : isActive
                      ? 'border-[#0aacce] text-[#0aacce]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 cursor-pointer'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
                {child.fullName}
                {child.desiredGrade && (
                  <span className="text-neutral-400 font-normal">({child.desiredGrade})</span>
                )}
                {hasDraft && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Rascunho salvo" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Form for selected child */}
      {selectedChild && !isAlreadyEvaluated ? (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Teacher & date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Professor *</label>
              <input
                type="text"
                {...register('teacherName', { required: 'Nome do professor obrigatório' })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce]"
              />
              {errors.teacherName && (
                <p className="text-xs text-red-500 mt-1">{errors.teacherName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Data *</label>
              <input
                type="date"
                {...register('evaluationDate', { required: true })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce]"
              />
            </div>
          </div>

          {/* 5 evaluation sections */}
          <EvaluationSection
            label="Comportamento"
            name="behavior"
            value={watch('behavior')}
            onChange={(v) => setValue('behavior', v)}
            placeholder={`Descreva o comportamento de ${selectedChild.fullName}...`}
          />
          <EvaluationSection
            label="Inglês"
            name="english"
            value={watch('english')}
            onChange={(v) => setValue('english', v)}
            placeholder={`Avaliação do nível de inglês de ${selectedChild.fullName}...`}
          />
          <EvaluationSection
            label="Interação com Crianças"
            name="interactionWithKids"
            value={watch('interactionWithKids')}
            onChange={(v) => setValue('interactionWithKids', v)}
            placeholder={`Como ${selectedChild.fullName} interagiu com os colegas...`}
          />
          <EvaluationSection
            label="Nivelamento - Matemática"
            name="mathPlacement"
            value={watch('mathPlacement')}
            onChange={(v) => setValue('mathPlacement', v)}
            placeholder="Resultado do teste de matemática..."
          />
          <EvaluationSection
            label="Nivelamento - Inglês"
            name="englishPlacement"
            value={watch('englishPlacement')}
            onChange={(v) => setValue('englishPlacement', v)}
            placeholder="Resultado do teste de inglês..."
          />
          <EvaluationSection
            label="Notas Adicionais"
            name="additionalNotes"
            value={watch('additionalNotes')}
            onChange={(v) => setValue('additionalNotes', v)}
            placeholder="Observações adicionais..."
          />

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-neutral-400">
              {pendingChildren.length > 1
                ? `Faltam ${pendingChildren.length} crianças`
                : 'Última criança pendente'}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
                Fechar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : pendingChildren.length > 1 ? (
                  'Salvar e Próximo'
                ) : (
                  'Salvar Avaliação'
                )}
              </button>
            </div>
          </div>
        </form>
      ) : selectedChild && isAlreadyEvaluated ? (
        <div className="p-6 text-center text-sm text-neutral-500">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p>{selectedChild.fullName} já foi avaliado(a).</p>
          {pendingChildren.length > 0 && (
            <button
              onClick={() => handleChildSwitch(pendingChildren[0].id)}
              className="mt-2 text-[#0aacce] hover:underline text-xs"
            >
              Ir para próxima criança pendente
            </button>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-neutral-400">
          Carregando dados...
        </div>
      )}
    </div>
  );
}
