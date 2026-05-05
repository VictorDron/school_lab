import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import { buildPricingBlock } from './pricing.js';

/**
 * One-shot payload for the invite detail page: invite, student, family
 * (via lead), contract (if any), fee payment (if any), and documents
 * scoped to this student. Kept deliberately flat so the frontend reads
 * exactly what the detail shell + sidebar + tabs need without chaining
 * follow-up requests.
 *
 * Scoping rules:
 * - `contract`: the most recent non-cancelled RENEWAL contract for the
 *   student's family. Re-enrollment periods are annual; if the family
 *   has a prior-year renewal contract, it will still surface here — the
 *   detail view is expected to render the same contract across
 *   consecutive periods until a new one is issued.
 * - `feePayment`: direct 1:1 relation on the invite.
 * - `documents`: scoped by lead + (optionally) childId when the invite's
 *   student is tied to a specific LeadChild. Family-level docs surface
 *   for every child of the family, per-child docs only on their own.
 * - `effectiveDeadline`: extendedDeadline if set, else period.endDate.
 */
export async function getInviteDetail(inviteId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    include: {
      period: {
        select: {
          id: true,
          name: true,
          targetYear: true,
          startDate: true,
          endDate: true,
          status: true,
          eligibleGrades: true,
          adjustmentPercent: true,
        },
      },
      student: {
        select: {
          id: true,
          code: true,
          fullName: true,
          grade: true,
          dateOfBirth: true,
          cpf: true,
          gender: true,
          nationality: true,
          leadId: true,
          leadChildId: true,
          academicYear: true,
          previousStudent: {
            select: {
              id: true,
              grade: true,
              academicYear: true,
              status: true,
            },
          },
          lead: {
            select: {
              id: true,
              code: true,
              familyName: true,
              primaryContactName: true,
              primaryContactEmail: true,
              primaryContactPhone: true,
              secondaryContactName: true,
              secondaryContactEmail: true,
              secondaryContactPhone: true,
              notificationPreference: true,
              notes: true,
              createdAt: true,
              address: {
                select: {
                  street: true,
                  number: true,
                  complement: true,
                  neighborhood: true,
                  city: true,
                  state: true,
                  zipCode: true,
                },
              },
              parents: {
                select: {
                  id: true,
                  fullName: true,
                  parentType: true,
                  email: true,
                  phone: true,
                  cpf: true,
                },
                orderBy: { createdAt: 'asc' },
              },
              children: {
                select: {
                  id: true,
                  fullName: true,
                  currentGrade: true,
                  studentType: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      },
      feePayment: {
        select: {
          id: true,
          amountPaid: true,
          paymentDate: true,
          paymentMethod: true,
          receiptUrl: true,
          createdAt: true,
          registeredBy: { select: { id: true, displayName: true, email: true } },
        },
      },
    },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  const [contract, documents, preResponse, exception, priceTableEntry] = await Promise.all([
    prisma.contract.findFirst({
      where: {
        leadId: invite.student.leadId,
        enrollmentType: 'RENEWAL',
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        enrollmentType: true,
        totalAnnualValue: true,
        installments: true,
        discountPercent: true,
        enrollmentFee: true,
        templateVersion: true,
        createdAt: true,
        updatedAt: true,
        sentAt: true,
        signedAt: true,
        signers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            signedAt: true,
          },
        },
        payments: {
          select: { id: true, status: true },
        },
      },
    }),
    prisma.leadEnrollmentDocument.findMany({
      where: {
        leadId: invite.student.leadId,
        ...(invite.student.leadChildId
          ? {
              OR: [{ childId: invite.student.leadChildId }, { childId: null }],
            }
          : {}),
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        category: true,
        fileName: true,
        fileUrl: true,
        fileSize: true,
        mimeType: true,
        status: true,
        rejectionReason: true,
        uploadedAt: true,
        reviewedAt: true,
        childId: true,
      },
    }),
    prisma.preReEnrollmentResponse.findUnique({
      where: { periodId_studentId: { periodId: invite.periodId, studentId: invite.studentId } },
      select: {
        id: true,
        status: true,
        communicatedAnnualValue: true,
        communicatedAdjustmentPercent: true,
        disagreementReason: true,
        negotiatedDiscountPercent: true,
        negotiatedFinalValue: true,
        negotiationJustification: true,
        respondedAt: true,
        emailSentAt: true,
        emailTo: true,
      },
    }),
    prisma.familyPriceException.findUnique({
      where: { periodId_studentId: { periodId: invite.periodId, studentId: invite.studentId } },
      select: {
        id: true,
        overrideAnnualValue: true,
        overrideDiscountPercent: true,
        justification: true,
        approvalStatus: true,
        approvedById: true,
        approvalDecidedAt: true,
        approvalNotes: true,
      },
    }),
    invite.student.grade
      ? prisma.periodPriceTable.findUnique({
          where: { periodId_grade: { periodId: invite.periodId, grade: invite.student.grade } },
          select: { baseAnnualValue: true, enrollmentFee: true, discountPercent: true },
        })
      : Promise.resolve(null),
  ]);

  const effectiveDeadline = invite.extendedDeadline ?? invite.period.endDate;

  const pricing = buildPricingBlock({
    periodAdjustmentPercent: invite.period.adjustmentPercent,
    priceTableEntry,
    exception,
    preResponse,
    contractPayments: contract ? contract.payments : null,
  });

  return {
    invite: {
      id: invite.id,
      periodId: invite.periodId,
      studentId: invite.studentId,
      token: invite.token,
      status: invite.status,
      gateStatus: invite.gateStatus,
      sentAt: invite.sentAt,
      openedAt: invite.openedAt,
      confirmedAt: invite.confirmedAt,
      declinedAt: invite.declinedAt,
      expiredAt: invite.expiredAt,
      declineReason: invite.declineReason,
      notes: invite.notes,
      emailStatus: invite.emailStatus,
      emailError: invite.emailError,
      emailSentAt: invite.emailSentAt,
      optOutReminders: invite.optOutReminders,
      extendedDeadline: invite.extendedDeadline,
      rematriculadoAt: invite.rematriculadoAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
    },
    effectiveDeadline,
    student: {
      id: invite.student.id,
      code: invite.student.code,
      fullName: invite.student.fullName,
      grade: invite.student.grade,
      dateOfBirth: invite.student.dateOfBirth,
      cpf: invite.student.cpf,
      gender: invite.student.gender,
      nationality: invite.student.nationality,
      leadChildId: invite.student.leadChildId,
      academicYear: invite.student.academicYear,
      previousStudent: invite.student.previousStudent,
    },
    lead: invite.student.lead,
    period: invite.period,
    contract: contract
      ? (() => {
          const { payments: _payments, ...rest } = contract;
          void _payments;
          return rest;
        })()
      : null,
    feePayment: invite.feePayment,
    documents,
    pricing,
  };
}

export type InviteDetailPayload = Awaited<ReturnType<typeof getInviteDetail>>;
