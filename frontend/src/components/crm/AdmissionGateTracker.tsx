import { useState, useEffect } from 'react';
import { Check, X, ChevronDown, ChevronRight, Loader2, Circle } from 'lucide-react';
import type { AdmissionGateStatus } from '@/types/crm';
import type { PipelinePhaseStatus } from '@/types/contract';
import { usePipelineStatus, useTransitionGate } from '@/hooks/useGateApprovals';
import { useAuthStore } from '@/stores/authStore';

interface AdmissionGateTrackerProps {
  status: AdmissionGateStatus;
  leadId?: string;
  compact?: boolean;
  defaultExpandCurrent?: boolean;
}

// Step labels in Portuguese
const stepLabels: Record<string, string> = {
  NOT_STARTED: 'Início',
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

const phaseNames = ['Contato', 'Pré Matrícula', 'Vivência', 'Matrícula', 'Contrato'];

const phaseIcons = ['📋', '🔍', '🎓', '📝', '📄'];

const allSteps: AdmissionGateStatus[] = [
  'NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED',
  'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED',
  'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED',
  'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED',
];

function getOverallPercentage(status: AdmissionGateStatus): number {
  if (status === 'REJECTED') return 0;
  if (status === 'ENROLLED') return 100;
  const idx = allSteps.indexOf(status);
  if (idx <= 0) return 0;
  return Math.round((idx / (allSteps.length - 1)) * 100);
}

function getStatusLabel(status: AdmissionGateStatus): string {
  return stepLabels[status] || status;
}

export function AdmissionGateTracker({ status, leadId, compact = false, defaultExpandCurrent = false }: AdmissionGateTrackerProps) {
  const isRejected = status === 'REJECTED';
  const isEnrolled = status === 'ENROLLED';

  if (compact) {
    const config = isRejected
      ? { label: 'Rejeitado', className: 'bg-red-100 text-red-800' }
      : isEnrolled
        ? { label: 'Matriculado', className: 'bg-emerald-100 text-emerald-800' }
        : status === 'APPROVED'
          ? { label: 'Aprovado', className: 'bg-green-100 text-green-800' }
          : status === 'NOT_STARTED'
            ? { label: 'Não iniciado', className: 'bg-neutral-100 text-neutral-600' }
            : { label: getStatusLabel(status), className: 'bg-[#0aacce]/10 text-[#0aacce]' };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  if (leadId) {
    return <FullPipelineTracker leadId={leadId} status={status} defaultExpandCurrent={defaultExpandCurrent} />;
  }

  // Fallback simple bar
  const percentage = getOverallPercentage(status);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-600">{getStatusLabel(status)}</span>
        <span className="text-neutral-400">{percentage}%</span>
      </div>
      <div className="w-full bg-neutral-100 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isEnrolled ? 'bg-emerald-500' : 'bg-[#0aacce]'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ─── Admin transition: compact inline dropdown ─────────────────
const validNextSteps: Record<string, { value: string; label: string }[]> = {
  NOT_STARTED: [
    { value: 'FORM_RECEIVED', label: 'Formulário Recebido' },
    { value: 'VISIT_SCHEDULED', label: 'Visita Agendada' },
  ],
  FORM_RECEIVED: [
    { value: 'FORM_APPROVED', label: 'Formulário Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ],
  FORM_APPROVED: [
    { value: 'VISIT_SCHEDULED', label: 'Visita Agendada' },
  ],
  VISIT_COMPLETED: [
    { value: 'INTERVIEW_COMPLETED', label: 'Entrevista Realizada' },
    { value: 'VISIT_APPROVED', label: 'Visita Aprovada' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ],
  INTERVIEW_COMPLETED: [
    { value: 'VISIT_APPROVED', label: 'Visita Aprovada' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ],
  VISIT_APPROVED: [
    { value: 'DOCS_REQUESTED', label: 'Docs Solicitados' },
    { value: 'VIVENCIA_SCHEDULED', label: 'Vivência Agendada' },
  ],
  DOCS_REQUESTED: [
    { value: 'DOCS_RECEIVED', label: 'Docs Recebidos' },
  ],
  DOCS_RECEIVED: [
    { value: 'VIVENCIA_SCHEDULED', label: 'Vivência Agendada' },
  ],
  CONTRACT_PENDING: [
    { value: 'CONTRACT_SIGNED', label: 'Contrato Assinado' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ],
  CONTRACT_SIGNED: [
    { value: 'FINANCIAL_APPROVED', label: 'Financeiro Aprovado' },
    { value: 'REJECTED', label: 'Rejeitado' },
  ],
  REJECTED: [
    { value: 'NOT_STARTED', label: 'Reabrir (Reiniciar)' },
  ],
};

// ─── Full Pipeline Tracker ─────────────────────────────────────
function FullPipelineTracker({ leadId, status, defaultExpandCurrent = false }: {
  leadId: string;
  status: AdmissionGateStatus;
  defaultExpandCurrent?: boolean;
}) {
  const { data: pipelineData } = usePipelineStatus(leadId);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [selectedNext, setSelectedNext] = useState('');

  const isRejected = status === 'REJECTED';
  const isEnrolled = status === 'ENROLLED';
  const { user } = useAuthStore();
  const transitionGate = useTransitionGate();

  const isAdmin = user?.role === 'ADMIN';
  const nextSteps = validNextSteps[status] || [];
  const canTransition = isAdmin && nextSteps.length > 0;

  const pipeline = pipelineData?.data;
  const phases: PipelinePhaseStatus[] = pipeline?.phases || buildPhasesFromStatus(status);
  const percentage = getOverallPercentage(status);

  // Auto-expand current phase
  useEffect(() => {
    if (defaultExpandCurrent && !hasAutoExpanded && phases.length > 0) {
      const idx = phases.findIndex(p => p.isCurrent);
      setExpandedPhases(new Set([idx >= 0 ? idx : 0]));
      setHasAutoExpanded(true);
    }
  }, [defaultExpandCurrent, hasAutoExpanded, phases]);

  const togglePhase = (index: number) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const handleTransition = (value: string) => {
    transitionGate.mutate(
      { leadId, newStatus: value },
      { onSuccess: () => { setShowAdminMenu(false); setSelectedNext(''); } }
    );
  };

  const currentStepIdx = allSteps.indexOf(status);

  return (
    <div className="space-y-3">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-end">
          {!isRejected && (
            <span className={`text-sm font-bold tabular-nums ${isEnrolled ? 'text-emerald-600' : 'text-[#0aacce]'}`}>
              {percentage}%
            </span>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isRejected ? 'bg-red-400' : isEnrolled ? 'bg-emerald-500' : 'bg-[#0aacce]'
            }`}
            style={{ width: `${isRejected ? 100 : percentage}%` }}
          />
        </div>

        {/* Current step label */}
        <p className="text-xs text-neutral-500">
          Etapa atual:{' '}
          <span className={`font-semibold ${
            isRejected ? 'text-red-600' : isEnrolled ? 'text-emerald-600' : 'text-neutral-800'
          }`}>
            {getStatusLabel(status)}
          </span>
        </p>
      </div>

      {/* Rejected state */}
      {isRejected && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <X className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-sm font-medium text-red-700">Lead Rejeitado</span>
        </div>
      )}

      {/* Phase rows */}
      <div className="space-y-1">
        {phases.map((phase, pi) => {
          const isExpanded = expandedPhases.has(pi);
          const isBlocked = phase.percentage === 0 && !phase.isCurrent && pi > 0 && phases[pi - 1].percentage < 100;
          const isComplete = phase.percentage === 100;

          return (
            <div key={pi} className={`rounded-lg transition-colors ${
              isExpanded && !isBlocked ? 'bg-neutral-50' : ''
            }`}>
              {/* Phase header */}
              <button
                onClick={() => !isBlocked && togglePhase(pi)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                  isBlocked ? 'opacity-35 cursor-default' : 'hover:bg-neutral-50'
                }`}
              >
                {/* Phase circle indicator */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : phase.isCurrent
                      ? 'bg-[#0aacce]/10 text-[#0aacce] ring-2 ring-[#0aacce]/20'
                      : 'bg-neutral-100 text-neutral-400'
                }`}>
                  {isComplete ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <span>{phaseIcons[pi]}</span>
                  )}
                </div>

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      isComplete ? 'text-emerald-700' :
                      phase.isCurrent ? 'text-neutral-900' :
                      isBlocked ? 'text-neutral-300' : 'text-neutral-500'
                    }`}>
                      {phaseNames[pi]}
                    </span>

                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Concluído
                        </span>
                      ) : !isBlocked && (
                        <span className="text-xs text-neutral-400 tabular-nums font-medium">
                          {phase.stepsCompleted}/{phase.totalSteps}
                        </span>
                      )}

                      {!isBlocked && (
                        isExpanded
                          ? <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Mini progress bar inside phase */}
                  {!isBlocked && !isComplete && (
                    <div className="mt-1.5 w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          phase.isCurrent ? 'bg-[#0aacce]' : 'bg-neutral-300'
                        }`}
                        style={{ width: `${phase.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* Expanded steps — timeline */}
              {isExpanded && !isBlocked && (
                <div className="ml-6 border-l-2 border-neutral-200 pl-4 pb-2 pt-1 space-y-0.5 mx-3">
                  {phase.steps.map((step, si) => {
                    const thisIdx = allSteps.indexOf(step as AdmissionGateStatus);
                    const isDone = thisIdx < currentStepIdx;
                    const isCurrent = step === status;
                    const isNext = thisIdx === currentStepIdx + 1;
                    const approvals = phase.approvals?.[step] || [];

                    return (
                      <div
                        key={si}
                        className={`flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-colors ${
                          isCurrent ? 'bg-[#0aacce]/[0.06]' : ''
                        }`}
                      >
                        {/* Step indicator */}
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-emerald-600" strokeWidth={3} />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full bg-[#0aacce] flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : isNext ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#0aacce]/40 flex items-center justify-center flex-shrink-0">
                            <Circle className="w-1.5 h-1.5 text-[#0aacce]/40" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                          </div>
                        )}

                        {/* Label */}
                        <span className={`text-xs leading-tight ${
                          isDone ? 'text-neutral-500' :
                          isCurrent ? 'text-[#0aacce] font-bold' :
                          isNext ? 'text-neutral-600' :
                          'text-neutral-400'
                        }`}>
                          {stepLabels[step] || step}
                        </span>

                        {/* Badges */}
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0aacce] text-white font-bold uppercase leading-none">
                            atual
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#0aacce]/10 text-[#0aacce] font-bold uppercase leading-none">
                            prox.
                          </span>
                        )}

                        {/* Approval badges */}
                        {approvals.length > 0 && (
                          <div className="flex items-center gap-1 ml-auto">
                            {approvals.map((a) => (
                              <span
                                key={a.id}
                                className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  a.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                  a.decision === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}
                              >
                                {a.decision === 'APPROVED' && <Check className="w-2.5 h-2.5" />}
                                {a.decision === 'REJECTED' && <X className="w-2.5 h-2.5" />}
                                {a.department.slice(0, 3).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin manual transition */}
      {canTransition && (
        <div className="pt-2 mt-1 border-t border-neutral-100">
          {!showAdminMenu ? (
            <button
              onClick={() => setShowAdminMenu(true)}
              className="text-xs text-neutral-400 hover:text-[#0aacce] transition-colors font-medium"
            >
              Avançar manualmente...
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedNext}
                onChange={(e) => setSelectedNext(e.target.value)}
                className="flex-1 text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0aacce]/30 focus:border-[#0aacce]"
              >
                <option value="">Selecione...</option>
                {nextSteps.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                disabled={!selectedNext || transitionGate.isPending}
                onClick={() => selectedNext && handleTransition(selectedNext)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#0aacce] text-white hover:bg-[#0998b8] disabled:opacity-40 transition-colors"
              >
                {transitionGate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
              </button>
              <button
                onClick={() => { setShowAdminMenu(false); setSelectedNext(''); }}
                className="text-neutral-400 hover:text-neutral-600 px-1 text-lg leading-none"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Build phases from status (no API) ─────────────────────────
function buildPhasesFromStatus(status: AdmissionGateStatus): PipelinePhaseStatus[] {
  const phaseSteps = [
    ['NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED'],
    ['VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED'],
    ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED'],
    ['APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
    ['CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED'],
  ];

  const currentIdx = allSteps.indexOf(status);

  return phaseSteps.map((steps, i) => {
    const isTerminalSuccess = status === 'ENROLLED';
    const completed = isTerminalSuccess
      ? steps.length
      : steps.filter(s => allSteps.indexOf(s as AdmissionGateStatus) < currentIdx).length;
    const isCurrent = !isTerminalSuccess && steps.some(s => s === status);
    const percentage = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

    return {
      name: phaseNames[i],
      steps,
      stepsCompleted: completed,
      totalSteps: steps.length,
      percentage,
      isCurrent,
      approvals: {},
    };
  });
}
