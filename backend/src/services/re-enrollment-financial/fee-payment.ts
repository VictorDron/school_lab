import { prisma } from '../../config/database.js';
import { uploadFile } from '../../config/supabase.js';
import { createAppError } from '../../lib/error-messages.js';
import { getNextGrade } from '../grade-progression.js';
import { transitionGate } from '../re-enrollment-gate.service.js';
import * as StudentsService from '../students/index.js';
import logger from '../../utils/logger.js';
import type { FeePaymentData } from './types.js';

/**
 * Register the entry-fee payment that promotes the family from
 * CONTRATO_ASSINADO → REMATRICULADO. The flow runs three steps:
 * 1) gate to TAXA_PAGA, 2) create the new-year Student row,
 * 3) gate to REMATRICULADO. The welcome email is best-effort — if Resend
 * blips we don't want to block the family from being marked enrolled.
 */
export async function registerFeePayment(
  inviteId: string,
  data: FeePaymentData,
  userId: string,
) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    include: { student: true, period: true, feePayment: true },
  });

  if (!invite) throw createAppError('INVITE_NOT_FOUND');
  if (invite.gateStatus !== 'CONTRATO_ASSINADO') {
    throw createAppError(
      'INVALID_GATE_TRANSITION_REENROLLMENT',
      `Expected CONTRATO_ASSINADO, got ${invite.gateStatus}`,
    );
  }
  if (invite.feePayment) {
    throw createAppError(
      'FEE_ALREADY_PAID',
      'Entrada já foi registrada para este convite.',
    );
  }

  let receiptUrl: string | null = null;
  if (data.receipt) {
    const path = `re-enrollment/receipts/${inviteId}/${Date.now()}-${data.receipt.originalname}`;
    receiptUrl = await uploadFile(data.receipt.buffer, path, data.receipt.mimetype);
  }

  const payment = await prisma.enrollmentFeePayment.create({
    data: {
      inviteId,
      amountPaid: data.amountPaid,
      paymentDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod,
      receiptUrl,
      registeredById: userId,
    },
  });

  await transitionGate(inviteId, 'TAXA_PAGA', userId);

  const nextGrade = getNextGrade(invite.student.grade ?? '') ?? '';
  await StudentsService.createStudentFromReEnrollment(
    invite.student,
    invite.period.targetYear,
    nextGrade,
  );

  await transitionGate(inviteId, 'REMATRICULADO', userId);

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: invite.student.leadId },
      select: { primaryContactEmail: true, familyName: true },
    });
    if (lead?.primaryContactEmail) {
      const { sendReEnrollmentWelcomeEmail } = await import('../email.service.js');
      const { getOrCreateSettings } = await import('../settings.service.js');
      const { getDefaultTenant } = await import('../tenant.service.js');
      const { id: tenantId } = await getDefaultTenant();
      const { schoolName } = await getOrCreateSettings(tenantId);
      await sendReEnrollmentWelcomeEmail({
        to: lead.primaryContactEmail,
        familyName: lead.familyName ?? '',
        studentName: invite.student.fullName,
        newGrade: nextGrade,
        targetYear: invite.period.targetYear,
        schoolName,
      });
    }
  } catch (emailErr) {
    logger.warn('Re-enrollment welcome email failed after fee payment', {
      inviteId,
      error: (emailErr as Error).message,
    });
  }

  return payment;
}
