/**
 * Client-side mirror of the backend re-enrollment state machine.
 *
 * Must stay in sync with backend/src/services/re-enrollment-core.service.ts
 * (validGateTransitions). The source of truth remains the backend — this
 * table powers the UI so we only offer valid buttons; illegal combinations
 * are still rejected on POST /invites/:id/gate-transition.
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

export const VALID_TRANSITIONS: Record<ReEnrollmentGateStatus, ReEnrollmentGateStatus[]> = {
  CONVITE_ENVIADO: ['FORMULARIO_CONFIRMADO', 'RECUSADO'],
  FORMULARIO_CONFIRMADO: ['DOCS_APROVADOS', 'CONTRATO_PENDENTE', 'RECUSADO'],
  DOCS_APROVADOS: ['CONTRATO_PENDENTE', 'RECUSADO'],
  CONTRATO_PENDENTE: ['CONTRATO_ASSINADO'],
  CONTRATO_ASSINADO: ['TAXA_PAGA', 'REMATRICULADO'],
  TAXA_PAGA: ['REMATRICULADO'],
  REMATRICULADO: [],
  RECUSADO: [],
};

export function getValidNextStates(
  current: ReEnrollmentGateStatus,
): ReEnrollmentGateStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

export function isTerminal(status: ReEnrollmentGateStatus): boolean {
  return status === 'REMATRICULADO' || status === 'RECUSADO';
}

/**
 * Imperative pt-BR action label per destination. Phrasing is scoped to
 * the user's perspective ("Marcar X", "Recusar") — these strings are
 * button captions on both the detail header and the Kanban card menu.
 */
export const TRANSITION_LABELS: Record<ReEnrollmentGateStatus, string> = {
  CONVITE_ENVIADO: 'Marcar convite enviado',
  FORMULARIO_CONFIRMADO: 'Marcar formulário confirmado',
  DOCS_APROVADOS: 'Aprovar documentos',
  CONTRATO_PENDENTE: 'Avançar para contrato',
  CONTRATO_ASSINADO: 'Marcar contrato assinado',
  TAXA_PAGA: 'Registrar taxa paga',
  REMATRICULADO: 'Concluir rematrícula',
  RECUSADO: 'Recusar',
};

/**
 * Short description of what the transition does, used as confirmation
 * modal body copy. Keeps the button label succinct while giving the
 * operator enough context before they confirm.
 */
export const TRANSITION_DESCRIPTIONS: Record<ReEnrollmentGateStatus, string> = {
  CONVITE_ENVIADO: 'Reabre o convite caso tenha sido movido por engano.',
  FORMULARIO_CONFIRMADO:
    'Confirma que a família preencheu o formulário de rematrícula e está pronta para a próxima etapa.',
  DOCS_APROVADOS:
    'Declara todos os documentos da família revisados e aprovados. O backend bloqueia esta ação se houver documentos pendentes ou reprovados.',
  CONTRATO_PENDENTE:
    'Avança para a fase de contrato. Use esta ação quando o contrato de renovação já foi criado e está aguardando assinatura.',
  CONTRATO_ASSINADO:
    'Registra manualmente que o contrato foi assinado. Normalmente isso acontece automaticamente via webhook do Clicksign.',
  TAXA_PAGA:
    'Marca a taxa de matrícula como paga. Use esta ação apenas se o registro detalhado do pagamento for feito em seguida.',
  REMATRICULADO:
    'Conclui a rematrícula do aluno. Essa é uma ação terminal e não pode ser revertida.',
  RECUSADO:
    'Marca a rematrícula como recusada pela família. Essa é uma ação terminal e não pode ser revertida.',
};

export type TransitionVariant = 'primary' | 'success' | 'danger';

/**
 * Visual tone for the transition button. Terminal destinations get a
 * distinct color so the operator reads the gravity of the action before
 * clicking — green for success, red for refusal, primary for everything
 * that advances the campaign along the happy path.
 */
export function getTransitionVariant(to: ReEnrollmentGateStatus): TransitionVariant {
  if (to === 'REMATRICULADO') return 'success';
  if (to === 'RECUSADO') return 'danger';
  return 'primary';
}

/**
 * Hints the operator about which action is blocking a transition that
 * isn't currently available. Surfaced in the detail page so a user on
 * FORMULARIO_CONFIRMADO who wants DOCS_APROVADOS understands the gate
 * without consulting a manual.
 */
export function getTransitionPrerequisite(to: ReEnrollmentGateStatus): string | null {
  switch (to) {
    case 'DOCS_APROVADOS':
      return 'Todos os documentos da família devem estar aprovados.';
    case 'CONTRATO_ASSINADO':
      return 'O contrato precisa existir e ter sido enviado para assinatura.';
    case 'TAXA_PAGA':
      return 'A taxa de matrícula precisa estar registrada.';
    default:
      return null;
  }
}
