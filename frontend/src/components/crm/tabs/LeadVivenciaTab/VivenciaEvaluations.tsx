import type { ExperienceEvaluation } from '@/types/crm';
import { EvaluationCard } from '../../evaluations/EvaluationCard';
import { ExperienceEvaluationForm } from '../../evaluations/ExperienceEvaluationForm';

interface VivenciaEvaluationsProps {
  evaluations: ExperienceEvaluation[];
  showEvalForm: boolean;
  evalEventId: string | null;
  leadId: string;
  onCloseEvalForm: () => void;
}

export function VivenciaEvaluations({
  evaluations,
  showEvalForm,
  evalEventId,
  leadId,
  onCloseEvalForm,
}: VivenciaEvaluationsProps) {
  return (
    <>
      {showEvalForm && evalEventId && (
        <section>
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
