import { prisma } from '../config/database.js';
import { createAppError } from '../lib/error-messages.js';
import { redis } from '../config/redis.js';
import { getIO } from '../socket/io.js';
import logger from '../utils/logger.js';

// ============================================================
// GATE STATE MACHINE
// ============================================================
//
// State diagram (happy path on the left, refusal on the right):
//
//   CONVITE_ENVIADO ────────▶ FORMULARIO_CONFIRMADO ─▶ DOCS_APROVADOS
//          │                          │                     │
//          │                          └─────────────────────┴─▶ CONTRATO_PENDENTE
//          │                                                        │
//          ▼                                                        ▼
//      RECUSADO                                              CONTRATO_ASSINADO
//                                                                  │
//                                                          ┌───────┴───────┐
//                                                          ▼               ▼
//                                                       TAXA_PAGA   REMATRICULADO
//                                                          │
//                                                          └─▶ REMATRICULADO
//
// Auto-transitions (these fire from outside transitionGate so the operator
// never has to click "Aprovar etapa" for transitions that are already
// implied by the upstream action):
//
//   • FORMULARIO_CONFIRMADO   ← submitReEnrollmentForm()
//       re-enrollment-form.service.ts:398
//   • DOCS_APROVADOS          ← reviewDocument() approves the LAST pending
//                               doc on a FORMULARIO_CONFIRMADO invite
//       re-enrollment-document.service.ts:reviewDocument
//   • CONTRATO_PENDENTE       ← createRenewalContract()
//       contract/contract-core.service.ts:312
//   • CONTRATO_ASSINADO       ← ClickSign auto_close webhook
//       contract/contract-webhook.service.ts:428,441
//   • TAXA_PAGA → REMATRICULADO ← registerFeePayment()
//       re-enrollment-financial.service.ts:69,80
//
// The frontend mirrors validGateTransitions in
// frontend/src/lib/re-enrollment-transitions.ts so the Kanban / detail page
// disable invalid moves before the request hits the server. Keep both in
// sync when adding or removing edges.

type ReEnrollmentGateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

const validGateTransitions: Record<ReEnrollmentGateStatus, ReEnrollmentGateStatus[]> = {
  CONVITE_ENVIADO: ['FORMULARIO_CONFIRMADO', 'RECUSADO'],
  FORMULARIO_CONFIRMADO: ['DOCS_APROVADOS', 'CONTRATO_PENDENTE', 'RECUSADO'],
  DOCS_APROVADOS: ['CONTRATO_PENDENTE', 'RECUSADO'],
  CONTRATO_PENDENTE: ['CONTRATO_ASSINADO'],
  CONTRATO_ASSINADO: ['TAXA_PAGA', 'REMATRICULADO'],
  TAXA_PAGA: ['REMATRICULADO'],
  REMATRICULADO: [],
  RECUSADO: [],
};

export function canTransitionGate(from: string, to: string): boolean {
  return (
    validGateTransitions[from as ReEnrollmentGateStatus]?.includes(
      to as ReEnrollmentGateStatus,
    ) ?? false
  );
}

const GATE_HISTORY_LABELS: Record<string, string> = {
  FORMULARIO_CONFIRMADO: 'Formulário de rematrícula preenchido',
  DOCS_APROVADOS: 'Documentos aprovados',
  CONTRATO_PENDENTE: 'Contrato de rematrícula criado',
  CONTRATO_ASSINADO: 'Contrato de rematrícula assinado',
  TAXA_PAGA: 'Pagamento da entrada registrado',
  REMATRICULADO: 'Rematrícula concluída',
  RECUSADO: 'Rematrícula recusada',
};

export async function transitionGate(
  inviteId: string,
  newStatus: string,
  userId?: string,
): Promise<void> {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      gateStatus: true,
      periodId: true,
      studentId: true,
      student: { select: { leadId: true } },
    },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  if (!canTransitionGate(invite.gateStatus, newStatus)) {
    throw createAppError(
      'INVALID_GATE_TRANSITION_REENROLLMENT',
      `${invite.gateStatus} -> ${newStatus}`,
    );
  }

  // STORY-009: Block DOCS_APROVADOS if any documents are PENDING or REJECTED
  if (newStatus === 'DOCS_APROVADOS') {
    const pendingOrRejected = await prisma.leadEnrollmentDocument.count({
      where: {
        leadId: invite.student.leadId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
    });
    if (pendingOrRejected > 0) {
      throw createAppError(
        'DOCS_NOT_ALL_APPROVED',
        `${pendingOrRejected} documento(s) ainda pendente(s) ou reprovado(s).`,
      );
    }
  }

  const previousStatus = invite.gateStatus;

  await prisma.reEnrollmentInvite.update({
    where: { id: inviteId },
    data: {
      gateStatus: newStatus as ReEnrollmentGateStatus,
      // Stamp the terminal transition so the Kanban auto-archive (30d) has
      // a stable reference independent of later edits to the row.
      ...(newStatus === 'REMATRICULADO' && { rematriculadoAt: new Date() }),
    },
  });

  try {
    await prisma.studentHistory.create({
      data: {
        studentId: invite.studentId,
        action: `RE_ENROLLMENT_${newStatus}`,
        details: {
          label: GATE_HISTORY_LABELS[newStatus] || `Etapa: ${newStatus}`,
          previousStatus,
          newStatus,
          inviteId,
          periodId: invite.periodId,
        },
        actorId: userId || null,
      },
    });
  } catch (histErr) {
    logger.warn('Failed to create student history for gate transition', {
      inviteId,
      newStatus,
      error: (histErr as Error).message,
    });
  }

  try {
    await redis.publish(
      're-enrollment:invites',
      JSON.stringify({ type: 'gate:transitioned', inviteId, newStatus }),
    );
    getIO()
      .to(`re-enrollment:${invite.periodId}`)
      .emit('re-enrollment:invite:updated', { inviteId, newStatus });
  } catch (err) {
    logger.warn('Re-enrollment gate event publish failed:', err);
  }
}
