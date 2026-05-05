import type { RefObject } from 'react';
import type { ExperienceEvaluation } from '@/types/crm';
import { EvaluationCard } from '../../evaluations/EvaluationCard';
import { ExperienceEvaluationForm } from '../../evaluations/ExperienceEvaluationForm';

interface ProcessoEvaluationsProps {
  evaluations: ExperienceEvaluation[];
  showEvalForm: boolean;
  evalEventId: string | null;
  evalFormRef: RefObject<HTMLDivElement>;
  leadId: string;
  onCloseEvalForm: () => void;
}

export function ProcessoEvaluations({
  evaluations,
  showEvalForm,
  evalEventId,
  evalFormRef,
  leadId,
  onCloseEvalForm,
}: ProcessoEvaluationsProps) {
  return (
    <>
      {showEvalForm && evalEventId && (
        <section ref={evalFormRef}>
          <ExperienceEvaluationForm
            eventId={evalEventId}
            leadId={leadId}
            onClose={onCloseEvalForm}
          />
        </section>
      )}

      {evaluations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Avaliações ({evaluations.length})
          </h3>
          <div className="space-y-3">
            {evaluations.map((evaluation) => (
              <EvaluationCard key={evaluation.id} evaluation={evaluation} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
