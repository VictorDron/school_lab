import { Check, Circle, X, AlertTriangle } from 'lucide-react';
import type { AdmissionGateStatus } from '@/types/crm';

interface PipelineStripProps {
  status: AdmissionGateStatus;
  leadId: string;
}

const phaseNames = ['Contato', 'Pré Matrícula', 'Vivência', 'Matrícula', 'Contrato'];

const allSteps: AdmissionGateStatus[] = [
  'NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED',
  'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED',
  'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED',
  'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED',
];

const phaseSteps = [
  ['NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED'],
  ['VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED'],
  ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED'],
  ['APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
  ['CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED'],
];

const stepLabels: Record<string, string> = {
  NOT_STARTED: 'Não Iniciado',
  FORM_RECEIVED: 'Formulário Recebido',
  FORM_APPROVED: 'Formulário Aprovado',
  VISIT_SCHEDULED: 'Visita Agendada',
  VISIT_COMPLETED: 'Visita Realizada',
  INTERVIEW_COMPLETED: 'Entrevista Realizada',
  VISIT_APPROVED: 'Visita Aprovada',
  DOCS_REQUESTED: 'Docs Solicitados',
  DOCS_RECEIVED: 'Docs Recebidos',
  VIVENCIA_SCHEDULED: 'Vivência Agendada',
  VIVENCIA_COMPLETED: 'Vivência Realizada',
  EVALUATION_PENDING: 'Avaliação Pendente',
  EVALUATION_COMPLETED: 'Avaliação Concluída',
  APPROVED: 'Aprovado',
  ENROLLMENT_PENDING: 'Matrícula Pendente',
  ENROLLMENT_COMPLETED: 'Matrícula Concluída',
  CONTRACT_PENDING: 'Contrato Pendente',
  CONTRACT_SIGNED: 'Contrato Assinado',
  FINANCIAL_APPROVED: 'Financeiro Aprovado',
  ENROLLED: 'Matriculado',
  REJECTED: 'Rejeitado',
};

function getOverallPercentage(status: AdmissionGateStatus): number {
  if (status === 'REJECTED') return 0;
  if (status === 'ENROLLED') return 100;
  const idx = allSteps.indexOf(status);
  if (idx <= 0) return 0;
  return Math.round((idx / (allSteps.length - 1)) * 100);
}

function getPhaseStatus(
  phaseIndex: number,
  currentStatus: AdmissionGateStatus,
): 'complete' | 'current' | 'pending' {
  if (currentStatus === 'ENROLLED') return 'complete';
  if (currentStatus === 'REJECTED') return 'pending';

  const currentIdx = allSteps.indexOf(currentStatus);
  const steps = phaseSteps[phaseIndex];
  const firstStepIdx = allSteps.indexOf(steps[0] as AdmissionGateStatus);
  const lastStepIdx = allSteps.indexOf(steps[steps.length - 1] as AdmissionGateStatus);

  if (currentIdx > lastStepIdx) return 'complete';
  if (currentIdx >= firstStepIdx && currentIdx <= lastStepIdx) return 'current';
  return 'pending';
}

function getPhaseSegmentWidth(phaseIndex: number, currentStatus: AdmissionGateStatus): number {
  const status = getPhaseStatus(phaseIndex, currentStatus);
  if (status === 'complete') return 100;
  if (status === 'pending') return 0;

  // Current phase: calculate partial progress
  const currentIdx = allSteps.indexOf(currentStatus);
  const steps = phaseSteps[phaseIndex];
  const firstStepIdx = allSteps.indexOf(steps[0] as AdmissionGateStatus);
  const completedInPhase = currentIdx - firstStepIdx;
  return Math.round((completedInPhase / steps.length) * 100);
}

export function PipelineStrip({ status, leadId: _leadId }: PipelineStripProps) {
  const isEnrolled = status === 'ENROLLED';
  const isRejected = status === 'REJECTED';
  const percentage = getOverallPercentage(status);

  // Enrolled state: green background
  if (isEnrolled) {
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
                {i < phaseNames.length - 1 && (
                  <span className="text-emerald-300 mx-0.5">-</span>
                )}
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
        <p className="text-xs text-emerald-600 font-medium">
          Etapa atual: Matriculado
        </p>
      </div>
    );
  }

  // Rejected state: red indicator
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
                {i < phaseNames.length - 1 && (
                  <span className="text-neutral-200 mx-0.5">-</span>
                )}
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
          <p className="text-xs text-red-600 font-medium">
            Etapa atual: Rejeitado
          </p>
        </div>
      </div>
    );
  }

  // Normal state: in-progress pipeline
  return (
    <div className="flex-shrink-0 bg-neutral-50 border-b border-neutral-200 px-4 py-2.5">
      {/* Phase names with indicators */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {phaseNames.map((name, i) => {
            const phaseStatus = getPhaseStatus(i, status);
            return (
              <div key={i} className="flex items-center gap-1">
                {/* Circle indicator */}
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
                {/* Phase name */}
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
                {i < phaseNames.length - 1 && (
                  <span className="text-neutral-200 mx-0.5">-</span>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-sm font-bold text-neutral-700">{percentage}%</span>
      </div>

      {/* Segmented progress bar */}
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

      {/* Current step label */}
      <p className="text-xs text-neutral-500">
        Etapa atual:{' '}
        <span className="font-medium text-neutral-700">
          {stepLabels[status] || status}
        </span>
      </p>
    </div>
  );
}
