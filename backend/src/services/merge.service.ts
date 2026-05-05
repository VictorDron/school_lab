import { Lead, LeadChild } from '@prisma/client';
import { PublicAdmissionData } from './admissions.service.js';

/**
 * Merge strategy types
 */
export type MergeStrategy = 'OVERWRITE' | 'KEEP_EXISTING' | 'APPEND' | 'SMART';

/**
 * Field-level merge strategies for lead data
 * Strategy: Family data overwrites admin data (family data is more current)
 */
export const LEAD_MERGE_STRATEGIES: Record<string, MergeStrategy> = {
  // PRESERVE - Admin sets these, family cannot change
  familyName: 'KEEP_EXISTING',
  source: 'KEEP_EXISTING',
  columnId: 'KEEP_EXISTING',
  createdById: 'KEEP_EXISTING',
  originType: 'KEEP_EXISTING',

  // OVERWRITE - Family data is more current
  primaryContactName: 'OVERWRITE',
  primaryContactEmail: 'OVERWRITE',
  primaryContactPhone: 'OVERWRITE',
  secondaryContactName: 'OVERWRITE',
  secondaryContactEmail: 'OVERWRITE',
  secondaryContactPhone: 'OVERWRITE',
  desiredGrades: 'SMART', // Merge existing + new grades

  // SMART - Special handling
  numberOfChildren: 'SMART', // Recalculated from children
  notes: 'APPEND', // Concatenate admin + family notes
  children: 'SMART', // Update form-submitted, preserve admin-added
};

/**
 * Merge lead contact data from family submission
 */
export function mergeContactData(
  existing: Lead,
  incoming: PublicAdmissionData
): Partial<Lead> {
  return {
    // Contact data - OVERWRITTEN by family (more current)
    primaryContactName: incoming.father.name,
    primaryContactEmail: incoming.father.email,
    primaryContactPhone: incoming.father.phone,
    secondaryContactName: incoming.mother?.name || null,
    secondaryContactEmail: incoming.mother?.email || null,
    secondaryContactPhone: incoming.mother?.phone || null,
  };
}

/**
 * Merge notes - append family notes to admin notes
 */
export function mergeNotes(existingNotes: string | null, familyComments: string | undefined): string | null {
  if (!familyComments?.trim()) {
    return existingNotes;
  }

  if (!existingNotes?.trim()) {
    return familyComments;
  }

  // Append family notes with separator
  return `${existingNotes}\n\n--- Observações da família ---\n${familyComments}`;
}

/**
 * Calculate number of children from submission
 */
export function calculateNumberOfChildren(incoming: PublicAdmissionData): number {
  return 1 + incoming.siblings.length;
}

/**
 * Check if any siblings are at the school
 * Improved logic: checks for common variations of the school name
 * and does NOT assume empty school means sibling is at our school
 */
export function checkSiblingsAtSchool(siblings: PublicAdmissionData['siblings']): boolean {
  // School name patterns that indicate sibling is at our school
  const schoolPatterns = [
    /\bris\b/i,           // "RIS" as a word
    /\bschool-lab\b/i,         // "School Lab"
    /internacional/i,     // Contains "Internacional"
    /international/i,     // Contains "International" (English)
    /nossa\s*escola/i,    // "Nossa escola" (our school)
    /mesma\s*escola/i,    // "Mesma escola" (same school)
    /aqui/i,              // "Aqui" (here)
    /^ris$/i,             // Exact match "RIS"
  ];

  return siblings.some(sibling => {
    if (!sibling.school?.trim()) {
      return false; // Empty school does NOT mean sibling is here
    }

    const schoolName = sibling.school.trim();

    // Check against patterns
    return schoolPatterns.some(pattern => pattern.test(schoolName));
  });
}

/**
 * Prepare child data for creation from student data
 */
export function prepareStudentChildData(
  leadId: string,
  incoming: PublicAdmissionData
): Omit<LeadChild, 'id' | 'createdAt' | 'updatedAt'> {
  const student = incoming.student || incoming.students?.[0];
  if (!student) {
    throw new Error('NO_STUDENTS_PROVIDED');
  }
  return {
    leadId,
    fullName: student.fullName,
    cpf: null,
    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
    gender: student.gender,
    nationality: student.nationality || null,
    desiredGrade: student.desiredGrade,
    currentGrade: student.currentGrade || null,
    currentSchool: student.currentSchool || null,
    specialNeeds: student.specialNeeds || null,
    studentType: student.studentType || null,
    primaryLanguage: student.primaryLanguage,
    otherLanguages: Array.isArray(student.otherLanguages)
      ? student.otherLanguages.filter(Boolean)
      : student.otherLanguages
        ? student.otherLanguages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    relationship: 'STUDENT',
    isApplicant: true,
  };
}

/**
 * Prepare sibling child data for creation
 */
export function prepareSiblingChildData(
  leadId: string,
  sibling: PublicAdmissionData['siblings'][0]
): Omit<LeadChild, 'id' | 'createdAt' | 'updatedAt'> | null {
  if (!sibling.name?.trim()) {
    return null;
  }

  return {
    leadId,
    fullName: sibling.name,
    cpf: sibling.cpf || null,
    dateOfBirth: sibling.dateOfBirth ? new Date(sibling.dateOfBirth) : null,
    gender: null,
    nationality: null,
    desiredGrade: sibling.grade || null,
    currentGrade: null,
    currentSchool: sibling.school || null,
    specialNeeds: null,
    studentType: null,
    primaryLanguage: null,
    otherLanguages: [],
    relationship: 'SIBLING',
    isApplicant: false,
  };
}

/**
 * Build the complete merged lead update data
 */
export function buildMergedLeadUpdate(
  existing: Lead,
  incoming: PublicAdmissionData
): Partial<Lead> & { applicationStatus: string; lastFormSubmittedAt: Date; formSubmissionCount: number } {
  const contactData = mergeContactData(existing, incoming);
  const numberOfChildren = calculateNumberOfChildren(incoming);
  const hasSiblingsAtSchool = checkSiblingsAtSchool(incoming.siblings);
  const mergedNotes = mergeNotes(existing.notes, incoming.additionalInfo?.otherRelevantInfo);

  return {
    ...contactData,
    numberOfChildren,
    desiredGrades: [...new Set([...(existing.desiredGrades || []), ...(incoming.students || []).map(s => s.desiredGrade), ...(incoming.student ? [incoming.student.desiredGrade] : [])])],
    hasSiblingsAtSchool,
    notes: mergedNotes,
    // Workflow status updates
    applicationStatus: 'FORM_RECEIVED',
    lastFormSubmittedAt: new Date(),
    formSubmissionCount: (existing.formSubmissionCount || 0) + 1,
  };
}
