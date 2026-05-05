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

// Tokens too generic to identify a specific school. Stripped when deriving
// brand-specific patterns from the configured schoolName so that strings like
// "Other School" don't false-positive against a schoolName of "School Lab".
const SCHOOL_NAME_STOPWORDS = new Set([
  'school', 'schools', 'escola', 'escolas',
  'colegio', 'colégio', 'college', 'institute', 'instituto',
  'the', 'a', 'an', 'do', 'da', 'de', 'dos', 'das', 'of',
]);

// Language hints that mean "this same school" regardless of the operator's
// brand name. Apply on top of the brand-derived patterns.
const GENERIC_SAME_SCHOOL_PATTERNS: readonly RegExp[] = [
  /nossa\s*escola/i,
  /mesma\s*escola/i,
  /\baqui\b/i,
  /our\s*school/i,
  /same\s*school/i,
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the set of regexes used to detect that a sibling's school string
 * refers to the operator's own school. Exported for unit testing.
 */
export function buildSchoolNamePatterns(schoolName: string): RegExp[] {
  const trimmed = schoolName?.trim() ?? '';
  if (!trimmed) return [];

  const patterns: RegExp[] = [];

  // Full-name match, tolerant to whitespace differences.
  const escapedFull = escapeRegex(trimmed).replace(/\s+/g, '\\s+');
  patterns.push(new RegExp(escapedFull, 'i'));

  // Distinctive tokens (>= 2 chars, alphanumeric, not a stopword).
  const tokens = trimmed
    .toLowerCase()
    .split(/[\s\-_/.,]+/)
    .filter(token =>
      token.length >= 2 &&
      !SCHOOL_NAME_STOPWORDS.has(token) &&
      /^[\p{L}\p{N}]+$/u.test(token)
    );

  for (const token of new Set(tokens)) {
    patterns.push(new RegExp(`\\b${escapeRegex(token)}\\b`, 'i'));
  }

  return patterns;
}

/**
 * Check if any siblings are at the operator's school.
 *
 * Combines brand-derived patterns (from `schoolName`, typically read from
 * `SystemSettings.schoolName`) with generic "our school / aqui" hints.
 * An empty sibling.school is treated as unknown, NOT as a positive match.
 */
export function checkSiblingsAtSchool(
  siblings: PublicAdmissionData['siblings'],
  schoolName: string,
): boolean {
  const patterns = [
    ...buildSchoolNamePatterns(schoolName),
    ...GENERIC_SAME_SCHOOL_PATTERNS,
  ];

  return siblings.some(sibling => {
    if (!sibling.school?.trim()) {
      return false;
    }
    const value = sibling.school.trim();
    return patterns.some(pattern => pattern.test(value));
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
  incoming: PublicAdmissionData,
  schoolName: string,
): Partial<Lead> & { applicationStatus: string; lastFormSubmittedAt: Date; formSubmissionCount: number } {
  const contactData = mergeContactData(existing, incoming);
  const numberOfChildren = calculateNumberOfChildren(incoming);
  const hasSiblingsAtSchool = checkSiblingsAtSchool(incoming.siblings, schoolName);
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
