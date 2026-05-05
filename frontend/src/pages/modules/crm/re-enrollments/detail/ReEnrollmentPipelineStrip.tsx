import { Check, Circle, X, AlertTriangle } from 'lucide-react';

/**
 * Pipeline strip for a re-enrollment invite — visual peer of
 * <PipelineStrip/> used on /crm/enrollments. Same tokens, same
 * structure, adapted to the 7-state gate flow (6 happy-path phases
 * plus the lateral RECUSADO terminal):
 *
 *   Convite → Formulário → Documentos → Contrato → Pagamento → Concluído
 *                                               └─ RECUSADO
 *
 * CONTRATO_PENDENTE and CONTRATO_ASSINADO share the "Contrato" phase
 * (same column grouping used by the Kanban service), so moving from
 * pending to signed fills the segment halfway → full.
 *
 * REMATRICULADO renders the success variant (emerald). RECUSADO renders
 * the failure variant (red).
 */

export type ReEnrollmentGateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

interface ReEnrollmentPipelineStripProps {
  status: ReEnrollmentGateStatus;
}

const phaseNames = ['Convite', 'Formulário', 'Documentos', 'Contrato', 'Pagamento', 'Concluído'];

const happyPathSteps: ReEnrollmentGateStatus[] = [
  'CONVITE_ENVIADO',
  'FORMULARIO_CONFIRMADO',
  'DOCS_APROVADOS',
  'CONTRATO_PENDENTE',
  'CONTRATO_ASSINADO',
  'TAXA_PAGA',
  'REMATRICULADO',
];

const phaseSteps: ReEnrollmentGateStatus[][] = [
  ['CONVITE_ENVIADO'],
  ['FORMULARIO_CONFIRMADO'],
  ['DOCS_APROVADOS'],
  ['CONTRATO_PENDENTE', 'CONTRATO_ASSINADO'],
  ['TAXA_PAGA'],
  ['REMATRICULADO'],
];

const stepLabels: Record<ReEnrollmentGateStatus, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Documentos Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Taxa Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

function getOverallPercentage(status: ReEnrollmentGateStatus): number {
  if (status === 'RECUSADO') return 0;
  if (status === 'REMATRICULADO') return 100;
  const idx = happyPathSteps.indexOf(status);
  if (idx <= 0) return 0;
  return Math.round((idx / (happyPathSteps.length - 1)) * 100);
}

function getPhaseStatus(
  phaseIndex: number,
  currentStatus: ReEnrollmentGateStatus,
): 'complete' | 'current' | 'pending' {
  if (currentStatus === 'REMATRICULADO') return 'complete';
  if (currentStatus === 'RECUSADO') return 'pending';

  const currentIdx = happyPathSteps.indexOf(currentStatus);
  const steps = phaseSteps[phaseIndex];
  const firstStepIdx = happyPathSteps.indexOf(steps[0]);
  const lastStepIdx = happyPathSteps.indexOf(steps[steps.length - 1]);

  if (currentIdx > lastStepIdx) return 'complete';
  if (currentIdx >= firstStepIdx && currentIdx <= lastStepIdx) return 'current';
  return 'pending';
}

function getPhaseSegmentWidth(
  phaseIndex: number,
  currentStatus: ReEnrollmentGateStatus,
): number {
  const status = getPhaseStatus(phaseIndex, currentStatus);
  if (status === 'complete') return 100;
  if (status === 'pending') return 0;

  // Current phase: partial progress based on how many sub-steps are done.
  const currentIdx = happyPathSteps.indexOf(currentStatus);
  const steps = phaseSteps[phaseIndex];
  const firstStepIdx = happyPathSteps.indexOf(steps[0]);
  const completedInPhase = currentIdx - firstStepIdx;
  return Math.round(((completedInPhase + 1) / steps.length) * 100);
}

export function ReEnrollmentPipelineStrip({ status }: ReEnrollmentPipelineStripProps) {
  const isDone = status === 'REMATRICULADO';
  const isRejected = status === 'RECUSADO';
  const percentage = getOverallPercentage(status);

  if (isDone) {
    return (
      <div className="flex-shrink-0 bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {phaseNames.map((name, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
                <span className="text-xs font-medium text-emerald-700">{name}</span>
                {i < phaseNames.length - 1 && <span className="text-emerald-300 mx-0.5">-</span>}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold text-emerald-700">100%</span>
        </div>
        <div className="flex gap-1 mb-1.5">
          {phaseNames.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-emerald-500" />
          ))}
        </div>
        <p className="text-xs text-emerald-600 font-medium">Etapa atual: Rematriculado</p>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="flex-shrink-0 bg-red-50 border-b border-red-200 px-4 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {phaseNames.map((name, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full bg-neutral-200 flex items-center justify-center">
                  <Circle className="w-2 h-2 text-neutral-400" />
                </div>
                <span className="text-xs text-neutral-400">{name}</span>
                {i < phaseNames.length - 1 && <span className="text-neutral-200 mx-0.5">-</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-sm font-bold text-red-600">0%</span>
          </div>
        </div>
        <div className="flex gap-1 mb-1.5">
          {phaseNames.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-neutral-200" />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <X className="w-3 h-3 text-red-500" />
          <p className="text-xs text-red-600 font-medium">Etapa atual: Recusado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 bg-neutral-50 border-b border-neutral-200 px-4 py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {phaseNames.map((name, i) => {
            const phaseStatus = getPhaseStatus(i, status);
            return (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    phaseStatus === 'complete'
                      ? 'bg-emerald-500'
                      : phaseStatus === 'current'
                        ? 'bg-[#0aacce] shadow-[0_0_0_2px_rgba(10,172,206,0.2)]'
                        : 'bg-neutral-200'
                  }`}
                >
                  {phaseStatus === 'complete' ? (
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  ) : phaseStatus === 'current' ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  ) : (
                    <Circle className="w-2 h-2 text-neutral-400" />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs ${
                    phaseStatus === 'complete'
                      ? 'text-emerald-700 font-medium'
                      : phaseStatus === 'current'
                        ? 'text-[#0aacce] font-bold'
                        : 'text-neutral-400'
                  }`}
                >
                  {name}
                </span>
                {i < phaseNames.length - 1 && <span className="text-neutral-200 mx-0.5">-</span>}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-bold text-neutral-700">{percentage}%</span>
      </div>

      <div className="flex gap-1 mb-1.5">
        {phaseNames.map((_, i) => {
          const phaseStatus = getPhaseStatus(i, status);
          const segmentWidth = getPhaseSegmentWidth(i, status);

          return (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  phaseStatus === 'complete'
                    ? 'bg-emerald-500'
                    : phaseStatus === 'current'
                      ? 'bg-[#0aacce]'
                      : ''
                }`}
                style={{ width: `${segmentWidth}%` }}
              />
            </div>
          );
        })}
      </div>

      <p className="text-xs text-neutral-500">
        Etapa atual:{' '}
        <span className="font-medium text-neutral-700">{stepLabels[status] || status}</span>
      </p>
    </div>
  );
}
