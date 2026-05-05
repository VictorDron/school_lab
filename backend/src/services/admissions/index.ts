import { prisma } from '../../config/database.js';
import { LeadSource } from '@prisma/client';
import { Request } from 'express';
import { buildApplicationDataResponse } from './response-builder.js';
import { runSubmissionTransaction } from './submit-transaction.js';
import { runPostSubmit } from './post-submit.js';
import { validateApplicationToken } from './tokens.js';

export {
  validateApplicationToken,
  generateApplicationLink,
  getTokenStatus,
  revokeToken,
  sendApplicationLinkByEmail,
} from './tokens.js';

export {
  uploadApplicationDocuments,
  getApplicationDocuments,
  deleteApplicationDocument,
} from './documents.js';

// Types - Complete data structure
export interface StudentData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality?: string;
  desiredGrade: string;
  currentGrade?: string;
  currentSchool?: string;
  specialNeeds?: string;
  studentType?: string; // NEW, RETURNING, CURRENT
  primaryLanguage: string;
  otherLanguages?: string | string[];
}

export interface ParentData {
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  occupation?: string;
  nativeLanguage?: string;
}

export interface SiblingData {
  name: string;
  cpf?: string;
  dateOfBirth?: string;
  grade?: string;
  school?: string;
}

export interface AddressData {
  country: string;
  state?: string;
  city: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  zipCode?: string;
}

export interface EducationHistoryData {
  schoolName: string;
  country?: string;
  city?: string;
  gradesAttended?: string;
}

export interface AdditionalInfoData {
  hasPsychoEvaluation: boolean;
  psychoEvaluationDetails?: string;
  hasAcademicSupport: boolean;
  academicSupportDetails?: string;
  hasHealthIssues: boolean;
  healthIssuesDetails?: string;
  hasAdaptationDifficulty: boolean;
  adaptationDifficultyDetails?: string;
  otherRelevantInfo?: string;
}

// Extended student data with per-child education history and additional info
export interface StudentDataWithDetails extends StudentData {
  educationHistory?: EducationHistoryData[];
  additionalInfo?: AdditionalInfoData;
}

export interface PublicAdmissionData {
  // Support both singular (backward compat) and plural
  student?: StudentData;
  students?: StudentDataWithDetails[];
  livesWith: string;
  guardianInfo?: string;
  father: ParentData;
  mother: ParentData;
  address: AddressData;
  siblings: SiblingData[];
  // Legacy: shared education history (used when single student)
  educationHistory?: EducationHistoryData[];
  // Legacy: shared additional info (used when single student)
  additionalInfo?: AdditionalInfoData;
  source: string;
  applicationToken?: string;
  notificationPreference?: 'FATHER' | 'MOTHER' | 'BOTH';
}

interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

// Source mapping
const sourceMap: Record<string, LeadSource> = {
  WEBSITE: 'WEBSITE',
  REFERRAL: 'REFERRAL',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  EVENT: 'EVENT',
  ADVERTISEMENT: 'ADVERTISEMENT',
  WALK_IN: 'WALK_IN',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  OTHER: 'OTHER',
};

/**
 * Derive family name from student name or parent name
 */
function deriveFamilyName(studentName: string, parentName: string): string {
  const studentNameParts = studentName.trim().split(' ');
  if (studentNameParts.length > 1) {
    return `Família ${studentNameParts[studentNameParts.length - 1]}`;
  }
  const parentNameParts = parentName.trim().split(' ');
  return `Família ${parentNameParts[parentNameParts.length - 1]}`;
}

/**
 * Get the default kanban column for new leads
 */
async function getDefaultColumn() {
  // First try to find a column marked as default
  let column = await prisma.kanbanColumn.findFirst({
    where: { isDefault: true },
  });

  // Fallback to first column by order
  if (!column) {
    column = await prisma.kanbanColumn.findFirst({
      orderBy: { order: 'asc' },
    });
  }

  return column;
}

/**
 * Get lead data for pre-filling the application form
 * Returns all available data for the family to review and complete
 */
export async function getApplicationData(token: string, metadata?: RequestMetadata) {
  const validation = await validateApplicationToken(token, metadata);

  if (!validation.valid || !validation.lead) {
    return { success: false, error: validation.error, data: null };
  }

  const lead = validation.lead;

  const [address, parents, educationHistory, additionalInfoList, documents] = await Promise.all([
    prisma.leadAddress.findUnique({ where: { leadId: lead.id } }),
    prisma.leadParent.findMany({ where: { leadId: lead.id } }),
    prisma.leadEducationHistory.findMany({
      where: { leadId: lead.id },
      orderBy: { orderIndex: 'asc' },
    }),
    prisma.leadAdditionalInfo.findMany({ where: { leadId: lead.id } }),
    prisma.leadDocument.findMany({
      where: { leadId: lead.id },
      orderBy: { uploadedAt: 'desc' },
    }),
  ]);

  return {
    success: true,
    error: null,
    data: buildApplicationDataResponse(lead, {
      address,
      parents,
      educationHistory,
      additionalInfoList,
      documents,
    }),
  };
}

/**
 * Submit admission form - REQUIRES valid token
 * Family complements data created by admin via the CRM
 * Now saves complete data to all related tables
 */
export async function submitAdmissionForm(
  data: PublicAdmissionData,
  req?: Request,
  metadata?: RequestMetadata,
) {
  if (!data.applicationToken) {
    throw new Error('TOKEN_REQUIRED');
  }

  const { lead, studentName } = await runSubmissionTransaction(data, metadata);

  await runPostSubmit({
    lead,
    studentName,
    motherEmail: data.mother.email,
    motherName: data.mother.name,
    applicationToken: data.applicationToken,
    req,
  });

  return {
    success: true,
    isUpdate: true,
    leadCode: lead.code,
    message: 'Inscrição enviada com sucesso',
  };
}

