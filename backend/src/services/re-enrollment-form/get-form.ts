import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import { findInviteByToken, updateInviteStatus } from '../re-enrollment-invite.service.js';
import { getNextGrade } from '../grade-progression.js';
import type { RequestMetadata } from './types.js';

export async function getFormData(token: string, _metadata?: RequestMetadata) {
  const invite = await findInviteByToken(token);

  if (invite.period.status === 'DRAFT') {
    throw createAppError('PERIOD_NOT_OPEN');
  }

  if (invite.period.status !== 'OPEN') {
    throw createAppError('FORM_PERIOD_CLOSED');
  }

  if (invite.status === 'SENT') {
    await updateInviteStatus(invite.id, 'OPENED');
  }

  const lead = await prisma.lead.findUnique({
    where: { id: invite.student.leadId },
    include: {
      children: true,
      parents: true,
      address: true,
      childrenHealth: true,
      childrenTransport: true,
      emergencyContacts: true,
      financialResponsible: true,
      healthPlan: true,
    },
  });

  if (!lead) {
    throw createAppError('LEAD_NOT_FOUND');
  }

  const child = lead.children.find((c: any) => c.id === invite.student.leadChildId) || null;
  const childHealth = lead.childrenHealth.find((h: any) => h.childId === invite.student.leadChildId) || null;
  const childTransport = lead.childrenTransport.find((t: any) => t.childId === invite.student.leadChildId) || null;
  const suggestedGrade = getNextGrade(invite.student.grade ?? '');

  // Check which recurring documents need renewal (expired or missing)
  // STORY-002: Fetch financial data from linked PreReEnrollmentResponse
  const preResponse = await prisma.preReEnrollmentResponse.findFirst({
    where: { periodId: invite.periodId, studentId: invite.studentId },
    orderBy: { createdAt: 'desc' },
    select: {
      communicatedAnnualValue: true,
      communicatedAdjustmentPercent: true,
    },
  });

  const financialInfo = preResponse
    ? {
        communicatedAnnualValue: preResponse.communicatedAnnualValue != null
          ? Number(preResponse.communicatedAnnualValue)
          : null,
        communicatedAdjustmentPercent: preResponse.communicatedAdjustmentPercent != null
          ? Number(preResponse.communicatedAdjustmentPercent)
          : null,
      }
    : null;

  const RECURRING_DOC_TYPES = ['MEDICAL_CERTIFICATE', 'RESIDENCE_PROOF', 'MEDICAL_REPORT'];
  const existingDocs = await prisma.leadEnrollmentDocument.findMany({
    where: {
      leadId: lead.id,
      childId: invite.student.leadChildId ?? undefined,
      documentType: { in: RECURRING_DOC_TYPES },
    },
    orderBy: { uploadedAt: 'desc' },
    select: { documentType: true, expiryDate: true, fileName: true, status: true, rejectionReason: true },
  });

  const now = new Date();
  const requiredDocuments = RECURRING_DOC_TYPES.map((docType) => {
    const existing = existingDocs.find((d) => d.documentType === docType);
    const isExpired = existing?.expiryDate ? new Date(existing.expiryDate) < now : true;
    const isApproved = existing?.status === 'APPROVED';
    const isRejected = existing?.status === 'REJECTED';
    const isValid = existing && isApproved && !isExpired;
    return {
      documentType: docType,
      label: docType === 'MEDICAL_CERTIFICATE'
        ? 'Atestado Médico para Prática de Esportes'
        : docType === 'MEDICAL_REPORT'
          ? 'Laudo Médico / Psicológico'
          : 'Comprovante de Residência',
      required: true,
      existingFileName: existing?.fileName ?? null,
      expiryDate: existing?.expiryDate ?? null,
      status: existing?.status ?? null,
      rejectionReason: existing?.rejectionReason ?? null,
      isValid,
      isRejected,
      needsUpload: !isValid,
    };
  });

  return {
    invite: {
      id: invite.id,
      token: invite.token,
      status: invite.status,
      periodId: invite.periodId,
    },
    period: {
      name: invite.period.name,
      targetYear: invite.period.targetYear,
      endDate: invite.period.endDate,
      eligibleGrades: invite.period.eligibleGrades,
    },
    student: {
      id: invite.student.id,
      fullName: invite.student.fullName,
      grade: invite.student.grade,
      dateOfBirth: invite.student.dateOfBirth,
      code: invite.student.code,
    },
    suggestedGrade,
    personalData: {
      child,
      parents: lead.parents,
      address: lead.address,
    },
    editableSections: {
      health: childHealth,
      transport: childTransport,
      emergencyContacts: lead.emergencyContacts,
      financialResponsible: lead.financialResponsible,
      healthPlan: lead.healthPlan,
    },
    requiredDocuments,
    financialInfo,
  };
}
