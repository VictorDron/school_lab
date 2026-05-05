import { nanoid } from 'nanoid';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { sendPreReEnrollmentEmail, sendReEnrollmentInviteEmail } from '../email.service.js';
import { getOrCreateSettings } from '../settings.service.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import { createInviteForStudent } from '../re-enrollment-invite.service.js';
import logger from '../../utils/logger.js';
import { formatBRL, toNum } from './shared.js';
import type {
  RecordResponseResult,
  RegisterNegotiationParams,
  ResponseData,
  SendEmailsParams,
  SendEmailsResult,
} from './types.js';

const FRONTEND_URL_FALLBACK = 'http://localhost:5173';

function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || FRONTEND_URL_FALLBACK;
}

function formatDeadlineBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Resolve the price the family will see in the email. Prefer the active
 * contract's annual value; fall back to the period price table for the
 * student's grade so first-time enrollees still get a number.
 */
async function resolveBaseAnnualValue(
  contractAnnualValue: number | null,
  periodId: string,
  grade: string | null,
): Promise<number | null> {
  if (contractAnnualValue != null) return contractAnnualValue;
  if (!grade) return null;
  const priceEntry = await prisma.periodPriceTable.findUnique({
    where: { periodId_grade: { periodId, grade } },
    select: { baseAnnualValue: true },
  });
  return priceEntry ? toNum(priceEntry.baseAnnualValue) : null;
}

async function resolveDiscountPercent(
  periodId: string,
  studentId: string,
): Promise<number | null> {
  const exception = await prisma.familyPriceException.findUnique({
    where: { periodId_studentId: { periodId, studentId } },
    select: { overrideDiscountPercent: true, approvalStatus: true },
  });
  return exception?.approvalStatus === 'APPROVED' ? toNum(exception.overrideDiscountPercent) : null;
}

/**
 * Send the pre-re-enrollment email batch. Per student: build the price
 * preview (with optional approved discount), persist a PreReEnrollmentResponse
 * row, auto-create a re-enrollment invite so the email links straight to
 * the form, then dispatch. Failures are tallied per student — one bad
 * email never aborts the rest of the batch.
 */
export async function sendPreReEnrollmentEmails(params: SendEmailsParams): Promise<SendEmailsResult> {
  const { periodId, studentIds, customBody, deadline } = params;

  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: {
      id: true,
      name: true,
      adjustmentPercent: true,
      preReEnrollmentDeadline: true,
      preReEnrollmentEmailTemplate: true,
    },
  });

  if (!period) {
    throw new Error('PERIOD_NOT_FOUND');
  }

  const adjustmentPercent = toNum(period.adjustmentPercent) ?? 0;

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      lead: {
        select: {
          familyName: true,
          primaryContactEmail: true,
          contracts: {
            where: { status: { in: ['ACTIVE', 'SIGNED'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { totalAnnualValue: true },
          },
        },
      },
      child: { select: { fullName: true } },
      familyPriceExceptions: {
        where: { periodId },
      },
    },
  });

  let sent = 0;
  let failed = 0;

  // Read once outside the loop — settings is shared across the whole batch.
  const tenantId = requireTenantId();
  const { schoolName } = await getOrCreateSettings(tenantId);

  for (const student of students) {
    try {
      const email = student.lead?.primaryContactEmail;

      if (!email) {
        logger.warn(`[PreReEnrollment] No email for student ${student.id}, skipping`);
        failed++;
        continue;
      }

      const contractAnnualValue = student.lead?.contracts?.[0]
        ? toNum(student.lead.contracts[0].totalAnnualValue)
        : null;

      const baseAnnualValue = await resolveBaseAnnualValue(
        contractAnnualValue,
        periodId,
        student.grade,
      );

      const communicatedAnnualValue = baseAnnualValue != null
        ? Math.round(baseAnnualValue * (1 + adjustmentPercent / 100) * 100) / 100
        : null;

      const token = nanoid();

      const response = await prisma.preReEnrollmentResponse.create({
        data: {
          tenantId,
          periodId,
          studentId: student.id,
          token,
          status: 'PENDING',
          emailTo: email,
          communicatedAnnualValue,
          communicatedAdjustmentPercent: adjustmentPercent,
        },
      });

      const familyName = student.lead?.familyName ?? 'Família';
      const studentName = student.child?.fullName ?? student.fullName;
      const grade = student.grade ?? '';

      const fullMonthly = communicatedAnnualValue != null
        ? formatBRL(communicatedAnnualValue / 12)
        : 'N/D';

      const discountPercent = await resolveDiscountPercent(periodId, student.id);
      let discountedMonthly = fullMonthly;
      if (communicatedAnnualValue != null && discountPercent != null && discountPercent > 0) {
        const discountedAnnual = communicatedAnnualValue * (1 - discountPercent / 100);
        discountedMonthly = formatBRL(discountedAnnual / 12);
      }

      const invite = await createInviteForStudent(periodId, student.id);
      const responseLink = `${getFrontendUrl()}/re-enrollment/${invite.token}`;

      await sendPreReEnrollmentEmail({
        to: email,
        familyName,
        studentName,
        grade,
        fullMonthlyValue: fullMonthly,
        discountedMonthlyValue: discountedMonthly,
        responseLink,
        deadline: formatDeadlineBR(deadline),
        customBody,
        schoolName,
      });

      await prisma.preReEnrollmentResponse.update({
        where: { id: response.id },
        data: { emailSentAt: new Date() },
      });

      sent++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[PreReEnrollment] Failed to send email for student ${student.id}: ${msg}`);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Record a parent's AGREED/DISAGREED response. On AGREED we kick off the
 * re-enrollment flow: create an invite and email the form link. Both side
 * effects are best-effort — the recorded response is the source of truth,
 * and the invite/email can be retried via the dashboard.
 */
export async function recordResponse(
  token: string,
  response: 'AGREED' | 'DISAGREED',
  reason?: string,
): Promise<RecordResponseResult> {
  const existing = await prisma.preReEnrollmentResponse.findFirst({
    where: { token },
  });

  if (!existing) {
    throw new Error('RESPONSE_NOT_FOUND');
  }

  if (existing.status !== 'PENDING') {
    throw new Error('ALREADY_RESPONDED');
  }

  const updated = await prisma.preReEnrollmentResponse.update({
    where: { id: existing.id },
    data: {
      status: response,
      respondedAt: new Date(),
      ...(response === 'DISAGREED' && reason ? { disagreementReason: reason } : {}),
    },
  });

  let reEnrollmentToken: string | undefined;
  if (response === 'AGREED') {
    try {
      const invite = await createInviteForStudent(updated.periodId, updated.studentId);
      reEnrollmentToken = invite.token;
      logger.info('Auto-created re-enrollment invite after AGREED', {
        periodId: updated.periodId,
        studentId: updated.studentId,
      });

      const student = await prisma.student.findUnique({
        where: { id: updated.studentId },
        include: { lead: true, child: true },
      });
      const period = await prisma.reEnrollmentPeriod.findUnique({
        where: { id: updated.periodId },
      });

      if (student?.lead?.primaryContactEmail && period) {
        const tenantId = requireTenantId();
        const { schoolName } = await getOrCreateSettings(tenantId);
        await sendReEnrollmentInviteEmail({
          to: student.lead.primaryContactEmail,
          familyName: student.lead.familyName ?? student.lead.primaryContactName ?? '',
          studentName: student.child?.fullName ?? student.lead.familyName ?? '',
          formLink: `${config.frontendUrl}/re-enrollment/${invite.token}`,
          suggestedGrade: student.grade,
          deadline: period.endDate,
          schoolName,
        });
        logger.info('Auto-sent re-enrollment form email after AGREED', {
          periodId: updated.periodId,
          studentId: updated.studentId,
          to: student.lead.primaryContactEmail,
        });
      }
    } catch (inviteErr) {
      logger.warn('Failed to auto-create invite or send email after AGREED', {
        periodId: updated.periodId,
        studentId: updated.studentId,
        error: (inviteErr as Error).message,
      });
    }
  }

  return {
    periodId: updated.periodId,
    studentId: updated.studentId,
    status: updated.status,
    reEnrollmentToken,
  };
}

export async function registerNegotiation(params: RegisterNegotiationParams): Promise<{
  periodId: string;
  studentId: string;
}> {
  const { responseId, discountPercent, finalValue, justification, approvedById } = params;

  const existing = await prisma.preReEnrollmentResponse.findUnique({
    where: { id: responseId },
  });

  if (!existing) {
    throw new Error('RESPONSE_NOT_FOUND');
  }

  if (existing.status !== 'DISAGREED' && existing.status !== 'NEGOTIATING') {
    throw new Error('INVALID_NEGOTIATION_STATUS');
  }

  const updated = await prisma.preReEnrollmentResponse.update({
    where: { id: responseId },
    data: {
      status: 'NEGOTIATED',
      negotiatedDiscountPercent: discountPercent,
      negotiatedFinalValue: finalValue,
      negotiationJustification: justification,
      negotiationApprovedById: approvedById,
      negotiationCompletedAt: new Date(),
    },
  });

  return {
    periodId: updated.periodId,
    studentId: updated.studentId,
  };
}

export async function getResponseData(token: string): Promise<ResponseData> {
  const response = await prisma.preReEnrollmentResponse.findFirst({
    where: { token },
    include: {
      student: {
        select: {
          fullName: true,
          grade: true,
          child: { select: { fullName: true } },
        },
      },
      period: {
        select: {
          name: true,
          preReEnrollmentDeadline: true,
        },
      },
    },
  });

  if (!response) {
    throw new Error('RESPONSE_NOT_FOUND');
  }

  return {
    id: response.id,
    token: response.token,
    status: response.status,
    studentName: response.student?.child?.fullName ?? response.student?.fullName ?? '',
    grade: response.student?.grade ?? null,
    periodName: response.period?.name ?? '',
    communicatedAnnualValue: toNum(response.communicatedAnnualValue),
    communicatedAdjustmentPercent: toNum(response.communicatedAdjustmentPercent),
    deadline: response.period?.preReEnrollmentDeadline ?? null,
  };
}

/**
 * Re-deliver the pre-re-enrollment email for a response that was already
 * created. Recomputes the discounted price (in case an exception was
 * approved meanwhile), but reuses the same response token so the parent's
 * link still works.
 */
export async function resendPreReEnrollmentEmail(responseId: string) {
  const response = await prisma.preReEnrollmentResponse.findUnique({
    where: { id: responseId },
    include: {
      student: {
        include: {
          lead: {
            select: {
              familyName: true,
              primaryContactEmail: true,
              contracts: {
                where: { status: { in: ['ACTIVE', 'SIGNED'] } },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { totalAnnualValue: true },
              },
            },
          },
          child: { select: { fullName: true } },
        },
      },
      period: {
        select: {
          name: true,
          adjustmentPercent: true,
          preReEnrollmentDeadline: true,
          preReEnrollmentEmailTemplate: true,
        },
      },
    },
  });

  if (!response) throw new Error('RESPONSE_NOT_FOUND');

  const email = response.emailTo || response.student?.lead?.primaryContactEmail;
  if (!email) throw new Error('NO_EMAIL_ADDRESS');

  const familyName = response.student?.lead?.familyName ?? 'Família';
  const studentName = response.student?.child?.fullName ?? response.student?.fullName ?? '';
  const grade = response.student?.grade ?? '';

  const communicatedAnnualValue = toNum(response.communicatedAnnualValue);
  const fullMonthly = communicatedAnnualValue != null
    ? formatBRL(communicatedAnnualValue / 12)
    : 'N/D';

  const discountPct = response.studentId
    ? await resolveDiscountPercent(response.periodId, response.studentId)
    : null;
  let discountedMonthly = fullMonthly;
  if (communicatedAnnualValue != null && discountPct != null && discountPct > 0) {
    discountedMonthly = formatBRL((communicatedAnnualValue * (1 - discountPct / 100)) / 12);
  }

  const responseLink = `${getFrontendUrl()}/public/pre-reenrollment/${response.token}`;

  const deadline = response.period?.preReEnrollmentDeadline;
  const formattedDeadline = deadline ? formatDeadlineBR(deadline) : '';

  const tenantId = requireTenantId();
  const { schoolName } = await getOrCreateSettings(tenantId);
  await sendPreReEnrollmentEmail({
    to: email,
    familyName,
    studentName,
    grade,
    fullMonthlyValue: fullMonthly,
    discountedMonthlyValue: discountedMonthly,
    responseLink,
    deadline: formattedDeadline,
    customBody: response.period?.preReEnrollmentEmailTemplate ?? '',
    schoolName,
  });

  await prisma.preReEnrollmentResponse.update({
    where: { id: responseId },
    data: { emailSentAt: new Date() },
  });

  return { success: true };
}
