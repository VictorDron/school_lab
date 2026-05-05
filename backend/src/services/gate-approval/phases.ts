import { AdmissionGateStatus } from '@prisma/client';

export interface PhaseDefinition {
  name: string;
  steps: AdmissionGateStatus[];
}

export const PHASES: PhaseDefinition[] = [
  {
    name: 'Contato',
    steps: ['NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED'],
  },
  {
    name: 'Pré Matrícula',
    steps: [
      'VISIT_SCHEDULED',
      'VISIT_COMPLETED',
      'INTERVIEW_COMPLETED',
      'VISIT_APPROVED',
      'DOCS_REQUESTED',
      'DOCS_RECEIVED',
    ],
  },
  {
    name: 'Vivência',
    steps: [
      'VIVENCIA_SCHEDULED',
      'VIVENCIA_COMPLETED',
      'EVALUATION_PENDING',
      'EVALUATION_COMPLETED',
    ],
  },
  {
    name: 'Matrícula',
    steps: ['APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
  },
  {
    name: 'Contrato',
    steps: [
      'CONTRACT_PENDING',
      'CONTRACT_SIGNED',
      'FINANCIAL_APPROVED',
      'ENROLLED',
    ],
  },
];

// Ordered list of all gate steps for determining "next" step
export const GATE_STEP_ORDER: AdmissionGateStatus[] = PHASES.flatMap((p) => p.steps);

export function getNextStep(
  current: AdmissionGateStatus,
): AdmissionGateStatus | null {
  const idx = GATE_STEP_ORDER.indexOf(current);
  if (idx === -1 || idx >= GATE_STEP_ORDER.length - 1) return null;
  return GATE_STEP_ORDER[idx + 1];
}

export function getPhaseForStep(step: AdmissionGateStatus): PhaseDefinition | null {
  return PHASES.find((p) => p.steps.includes(step)) ?? null;
}
