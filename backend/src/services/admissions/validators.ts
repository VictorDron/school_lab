import type { Lead } from '@prisma/client';
import type { PublicAdmissionData, StudentDataWithDetails } from './index.js';

export const MAX_SUBMISSIONS_PER_TOKEN = 5;

/**
 * Normalize the submission's student payload. The CRM accepts both the
 * historical singular `student` shape and the multi-applicant `students`
 * array. We collapse both into a single list so the rest of the pipeline
 * never branches on shape. Throws when neither is provided.
 */
export function normalizeStudentList(data: PublicAdmissionData): StudentDataWithDetails[] {
  const students: StudentDataWithDetails[] = data.students
    ? data.students
    : data.student
      ? [{
          ...data.student,
          educationHistory: data.educationHistory || [],
          additionalInfo: data.additionalInfo,
        }]
      : [];

  if (students.length === 0) {
    throw new Error('NO_STUDENTS_PROVIDED');
  }

  return students;
}

/**
 * Run every gate that must hold before we accept the submission. Throws the
 * exact error code the controller's error map expects.
 */
export function assertSubmissionAllowed(existingLead: Lead): void {
  if (existingLead.applicationTokenExpires && new Date() > existingLead.applicationTokenExpires) {
    throw new Error('TOKEN_EXPIRED');
  }

  if ((existingLead.formSubmissionCount || 0) >= MAX_SUBMISSIONS_PER_TOKEN) {
    throw new Error('MAX_SUBMISSIONS_EXCEEDED');
  }
}
