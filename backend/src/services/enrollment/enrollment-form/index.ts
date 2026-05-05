import { prisma } from '../../../config/database.js';
import { Request } from 'express';
import { validateEnrollmentToken } from '../enrollment-token.service.js';
import type {
  PublicEnrollmentData,
  RequestMetadata,
} from '../../../types/enrollment.types.js';
import { buildEnrollmentDataResponse } from './response-builder.js';
import { runSubmissionTransaction } from './submit-transaction.js';
import { runPostSubmit } from './post-submit.js';

// ==================== GET PRE-POPULATED DATA ====================

/**
 * Get enrollment data for pre-filling the form
 * Returns data from the admission form (Form 1) plus any existing enrollment data
 */
export async function getEnrollmentData(token: string, metadata?: RequestMetadata) {
  const validation = await validateEnrollmentToken(token, metadata);

  if (!validation.valid || !validation.lead) {
    return { success: false, error: validation.error, data: null };
  }

  const lead = validation.lead;

  const [
    additionalInfoList,
    childrenHealth,
    emergencyContacts,
    healthPlan,
    transport,
    enrollmentInfoList,
    financialResponsible,
    enrollmentDocuments,
    childrenTransport,
  ] = await Promise.all([
    prisma.leadAdditionalInfo.findMany({ where: { leadId: lead.id } }),
    prisma.leadChildHealth.findMany({ where: { leadId: lead.id } }),
    prisma.leadEmergencyContact.findMany({ where: { leadId: lead.id } }),
    prisma.leadHealthPlan.findUnique({ where: { leadId: lead.id } }),
    prisma.leadTransport.findUnique({ where: { leadId: lead.id } }),
    prisma.leadEnrollmentInfo.findMany({ where: { leadId: lead.id } }),
    prisma.leadFinancialResponsible.findUnique({ where: { leadId: lead.id } }),
    prisma.leadEnrollmentDocument.findMany({ where: { leadId: lead.id } }),
    prisma.leadChildTransport.findMany({ where: { leadId: lead.id } }),
  ]);

  return {
    success: true,
    error: null,
    data: buildEnrollmentDataResponse(lead, {
      additionalInfoList,
      childrenHealth,
      emergencyContacts,
      healthPlan,
      transport,
      enrollmentInfoList,
      financialResponsible,
      enrollmentDocuments,
      childrenTransport,
    }),
  };
}

// ==================== SUBMIT ENROLLMENT FORM ====================

/**
 * Submit enrollment form - REQUIRES valid token
 */
export async function submitEnrollmentForm(
  data: PublicEnrollmentData,
  req?: Request,
  metadata?: RequestMetadata,
) {
  if (!data.enrollmentToken) {
    throw new Error('TOKEN_REQUIRED');
  }

  const { lead, studentName, motherEmail } = await runSubmissionTransaction(data, metadata);

  await runPostSubmit({
    lead,
    studentName,
    motherEmail,
    enrollmentToken: data.enrollmentToken,
    req,
    metadata,
  });

  return {
    success: true,
    leadCode: lead.code,
    message: 'Matrícula enviada com sucesso',
  };
}
