import type { LeadChild, Prisma } from '@prisma/client';
import { normalizeCPF } from '../../utils/formatters.js';
import logger from '../../utils/logger.js';
import type { SiblingData, StudentDataWithDetails } from './index.js';

type Tx = Prisma.TransactionClient;

export interface CreatedStudent {
  child: LeadChild;
  studentData: StudentDataWithDetails;
}

/**
 * `otherLanguages` arrives in two shapes from the form: a CSV string when
 * coming from the legacy single-input field, or an array from the modern
 * multi-select. Normalizing here keeps the create call site unaware of the
 * difference.
 */
function splitLanguages(otherLanguages: string | string[] | undefined): string[] {
  if (Array.isArray(otherLanguages)) {
    return otherLanguages.map(s => s.trim()).filter(Boolean);
  }
  if (otherLanguages) {
    return otherLanguages.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Create one LeadChild row per applicant student. Returns the created child
 * paired with its source data so downstream creates (education history,
 * additional info, document association) can target the right id.
 */
export async function createApplicantChildren(
  tx: Tx,
  leadId: string,
  students: StudentDataWithDetails[],
): Promise<CreatedStudent[]> {
  const createdStudents: CreatedStudent[] = [];
  for (const student of students) {
    const studentChild = await tx.leadChild.create({
      data: {
        leadId,
        fullName: student.fullName,
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
        gender: student.gender,
        nationality: student.nationality || null,
        desiredGrade: student.desiredGrade,
        currentGrade: student.currentGrade || null,
        studentType: student.studentType || 'NEW',
        primaryLanguage: student.primaryLanguage,
        otherLanguages: splitLanguages(student.otherLanguages),
        relationship: 'STUDENT',
        isApplicant: true,
      },
    });
    createdStudents.push({ child: studentChild, studentData: student });
  }
  return createdStudents;
}

/**
 * Batch-create non-applicant siblings. Empty/whitespace-only names are
 * dropped — the form sends pre-allocated rows the family may have left blank.
 */
export async function createSiblings(
  tx: Tx,
  leadId: string,
  siblings: SiblingData[],
): Promise<void> {
  const siblingsToCreate = siblings
    .filter(s => s.name?.trim())
    .map(sibling => ({
      leadId,
      fullName: sibling.name,
      cpf: normalizeCPF(sibling.cpf),
      dateOfBirth: sibling.dateOfBirth ? new Date(sibling.dateOfBirth) : null,
      desiredGrade: sibling.grade || null,
      currentSchool: sibling.school || null,
      relationship: 'SIBLING' as const,
      isApplicant: false,
    }));

  if (siblingsToCreate.length === 0) return;
  await tx.leadChild.createMany({ data: siblingsToCreate });
}

/**
 * Create per-applicant education history rows. Empty schoolName entries are
 * dropped (form sends placeholder rows). orderIndex preserves the visual
 * order the family entered.
 */
export async function createEducationHistoryPerChild(
  tx: Tx,
  leadId: string,
  createdStudents: CreatedStudent[],
): Promise<void> {
  for (const { child, studentData } of createdStudents) {
    const eduHistory = studentData.educationHistory || [];
    const educationToCreate = eduHistory
      .filter(edu => edu.schoolName?.trim())
      .map((edu, i) => ({
        leadId,
        childId: child.id,
        schoolName: edu.schoolName,
        country: edu.country || null,
        city: edu.city || null,
        gradesAttended: edu.gradesAttended || null,
        orderIndex: i,
      }));

    if (educationToCreate.length > 0) {
      await tx.leadEducationHistory.createMany({ data: educationToCreate });
    }
  }
}

/**
 * Create per-applicant additional-info rows. The whole record is optional —
 * skip applicants whose payload didn't include it.
 */
export async function createAdditionalInfoPerChild(
  tx: Tx,
  leadId: string,
  createdStudents: CreatedStudent[],
): Promise<void> {
  for (const { child, studentData } of createdStudents) {
    const info = studentData.additionalInfo;
    if (!info) continue;
    await tx.leadAdditionalInfo.create({
      data: {
        leadId,
        childId: child.id,
        hasPsychoEvaluation: info.hasPsychoEvaluation || false,
        psychoEvaluationDetails: info.psychoEvaluationDetails || null,
        hasAcademicSupport: info.hasAcademicSupport || false,
        academicSupportDetails: info.academicSupportDetails || null,
        hasHealthIssues: info.hasHealthIssues || false,
        healthIssuesDetails: info.healthIssuesDetails || null,
        hasAdaptationDifficulty: info.hasAdaptationDifficulty || false,
        adaptationDifficultyDetails: info.adaptationDifficultyDetails || null,
        otherRelevantInfo: info.otherRelevantInfo || null,
      },
    });
  }
}

/**
 * Documents are uploaded before the children exist (the public form uploads
 * each file with a `childIndex` slot). After applicants are created, we
 * stamp the matching `childId` onto each document. Documents whose index
 * never matches a child get logged as a soft warning so they can be hand-
 * fixed — they remain accessible at the lead level.
 */
export async function associateDocumentsToChildren(
  tx: Tx,
  leadId: string,
  createdStudents: CreatedStudent[],
): Promise<void> {
  for (let i = 0; i < createdStudents.length; i++) {
    await tx.leadDocument.updateMany({
      where: { leadId, childIndex: i },
      data: { childId: createdStudents[i].child.id },
    });
  }

  const orphanedDocs = await tx.leadDocument.count({
    where: { leadId, childId: null, childIndex: { not: null } },
  });
  if (orphanedDocs > 0) {
    logger.warn(`${orphanedDocs} documents with invalid childIndex for lead ${leadId}`);
  }
}
