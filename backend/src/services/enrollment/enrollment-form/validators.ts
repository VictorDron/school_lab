import type { Lead, LeadChild } from '@prisma/client';
import type { PublicEnrollmentData } from '../../../types/enrollment.types.js';
import { MAX_SUBMISSIONS_PER_TOKEN } from '../enrollment-token.service.js';

/**
 * Gate states that mean enrollment is already past the form-submission step.
 * Re-submitting the form must be rejected for any of these.
 */
const POST_FORM_GATE_STATES = new Set([
  'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'FINANCIAL_APPROVED',
  'ENROLLED',
]);

/**
 * Run every precondition guard against the existing lead and incoming data.
 * Throws the exact error code expected by the controller's error map; returns
 * the applicant children list on success so callers don't refilter.
 */
export function assertSubmissionAllowed(
  existingLead: Lead & { children: LeadChild[] },
  data: PublicEnrollmentData,
): { applicantChildren: LeadChild[] } {
  if (existingLead.enrollmentTokenExpires && new Date() > existingLead.enrollmentTokenExpires) {
    throw new Error('TOKEN_EXPIRED');
  }

  if (existingLead.applicationStatus !== 'FORM_RECEIVED') {
    throw new Error('ADMISSION_NOT_COMPLETED');
  }

  if (existingLead.admissionGateStatus && POST_FORM_GATE_STATES.has(existingLead.admissionGateStatus)) {
    throw new Error('ENROLLMENT_ALREADY_COMPLETED');
  }

  if ((existingLead.enrollmentSubmissionCount || 0) >= MAX_SUBMISSIONS_PER_TOKEN) {
    throw new Error('MAX_SUBMISSIONS_EXCEEDED');
  }

  if (!data.termsAccepted) {
    throw new Error('TERMS_NOT_ACCEPTED');
  }

  const applicantChildren = existingLead.children.filter(
    c => c.isApplicant && c.relationship === 'STUDENT',
  );
  if (applicantChildren.length === 0) {
    throw new Error('APPLICANT_NOT_FOUND');
  }

  return { applicantChildren };
}

/**
 * Verify every per-child payload references one of this lead's applicant
 * children — guards against a tampered token-bound submission targeting
 * another family's children.
 */
export function assertChildIdsBelongToLead(
  applicantChildren: LeadChild[],
  data: PublicEnrollmentData,
): void {
  if (!data.childrenData || data.childrenData.length === 0) return;
  const applicantChildIds = new Set(applicantChildren.map(c => c.id));
  for (const childData of data.childrenData) {
    if (!applicantChildIds.has(childData.childId)) {
      throw new Error('INVALID_CHILD_ID');
    }
  }
}
