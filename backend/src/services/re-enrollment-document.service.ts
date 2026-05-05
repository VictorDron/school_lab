import { prisma } from '../config/database.js';
import { createAppError } from '../lib/error-messages.js';
import logger from '../utils/logger.js';

export interface ReviewDocumentInput {
  inviteId: string;
  docId: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  userId: string;
}

export interface ReviewDocumentResult {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
}

/**
 * Reviews a re-enrollment document (approve/reject) and, when the action
 * approves the last pending/rejected document of the lead AND the invite is
 * still on FORMULARIO_CONFIRMADO, fires the auto-transition to DOCS_APROVADOS.
 *
 * The auto-transition is fail-soft: a transition error never bubbles back to
 * the reviewer. Mirrors contract-core.service.ts:309 pattern.
 */
export async function reviewDocument(input: ReviewDocumentInput): Promise<ReviewDocumentResult> {
  const { inviteId, docId, status, rejectionReason, userId } = input;

  if (status === 'REJECTED' && !rejectionReason?.trim()) {
    throw createAppError('REJECTION_REASON_REQUIRED');
  }

  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      studentId: true,
      periodId: true,
      gateStatus: true,
      student: { select: { leadId: true, fullName: true } },
    },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  const doc = await prisma.leadEnrollmentDocument.findFirst({
    where: { id: docId, leadId: invite.student.leadId },
  });

  if (!doc) {
    throw createAppError('DOCUMENT_NOT_FOUND');
  }

  const updatedDoc = await prisma.leadEnrollmentDocument.update({
    where: { id: docId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      reviewedAt: new Date(),
      reviewedBy: userId,
    },
  });

  try {
    await prisma.studentHistory.create({
      data: {
        studentId: invite.studentId,
        action: status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
        details: {
          documentId: docId,
          documentType: updatedDoc.documentType,
          fileName: updatedDoc.fileName,
          ...(status === 'REJECTED' && rejectionReason ? { rejectionReason } : {}),
        },
        actorId: userId,
      },
    });
  } catch (histErr) {
    logger.warn('Failed to create doc review history', { docId, error: (histErr as Error).message });
  }

  if (status === 'APPROVED' && invite.gateStatus === 'FORMULARIO_CONFIRMADO') {
    const pendingOrRejected = await prisma.leadEnrollmentDocument.count({
      where: {
        leadId: invite.student.leadId,
        status: { in: ['PENDING', 'REJECTED'] },
      },
    });

    if (pendingOrRejected === 0) {
      try {
        const { transitionGate } = await import('./re-enrollment-gate.service.js');
        await transitionGate(inviteId, 'DOCS_APROVADOS', userId);
      } catch (err) {
        logger.warn('Auto-transition to DOCS_APROVADOS failed', {
          inviteId,
          error: (err as Error).message,
        });
      }
    }
  }

  return {
    id: updatedDoc.id,
    status: updatedDoc.status as 'APPROVED' | 'REJECTED',
    rejectionReason: updatedDoc.rejectionReason,
  };
}
