import * as crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { sendEnrollmentLinkEmail } from '../email.service.js';
import { getNotificationRecipients } from '../../utils/notification-contacts.js';
import type { RequestMetadata } from '../../types/enrollment.types.js';

// Constants
const TOKEN_EXPIRY_HOURS = 168; // 7 days
const MAX_SUBMISSIONS_PER_TOKEN = 5;

// ==================== TOKEN VALIDATION ====================

/**
 * Validate enrollment token and check expiration
 */
export async function validateEnrollmentToken(token: string, metadata?: RequestMetadata) {
  const lead = await prisma.lead.findFirst({
    where: { enrollmentToken: token },
    include: {
      children: true,
      parents: true,
      address: true,
    },
  });

  if (!lead) {
    return { valid: false, error: 'TOKEN_NOT_FOUND', lead: null };
  }

  // Check if admission form was completed
  if (lead.applicationStatus !== 'FORM_RECEIVED') {
    return { valid: false, error: 'ADMISSION_NOT_COMPLETED', lead: null };
  }

  // Check if token has expired
  if (lead.enrollmentTokenExpires && new Date() > lead.enrollmentTokenExpires) {
    await prisma.applicationTokenLog.create({
      data: {
        leadId: lead.id,
        token,
        action: 'ENROLLMENT_EXPIRED',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });
    return { valid: false, error: 'TOKEN_EXPIRED', lead: null };
  }

  // Log the access
  await prisma.applicationTokenLog.create({
    data: {
      leadId: lead.id,
      token,
      action: 'ENROLLMENT_ACCESSED',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { valid: true, error: null, lead };
}

// ==================== GENERATE ENROLLMENT LINK ====================

/**
 * Generate enrollment link with 7-day expiration
 * Only allowed when admission form is completed
 */
export async function generateEnrollmentLink(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { children: true },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  // Verify admission was completed
  if (lead.applicationStatus !== 'FORM_RECEIVED') {
    throw new Error('ADMISSION_NOT_COMPLETED');
  }

  // Verify there are applicant children
  const applicantChildren = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
  if (applicantChildren.length === 0) {
    throw new Error('APPLICANT_NOT_FOUND');
  }

  // Generate a secure token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Update lead with new enrollment token
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      enrollmentToken: token,
      enrollmentTokenExpires: expiresAt,
      enrollmentStatus: 'LINK_SENT',
      enrollmentSentAt: new Date(),
    },
  });

  // Log token generation
  await prisma.applicationTokenLog.create({
    data: {
      leadId,
      token,
      action: 'ENROLLMENT_GENERATED',
    },
  });

  // Create history entry
  const studentNames = applicantChildren.map(c => c.fullName);
  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'ENROLLMENT_LINK_GENERATED',
      actorId: userId,
      details: {
        expiresAt: expiresAt.toISOString(),
        expiryHours: TOKEN_EXPIRY_HOURS,
        studentNames,
        studentsCount: applicantChildren.length,
      },
    },
  });

  const enrollmentLink = `${process.env.FRONTEND_URL}/enrollment/apply?token=${token}`;

  return {
    enrollmentLink,
    token,
    expiresAt,
    expiryHours: TOKEN_EXPIRY_HOURS,
  };
}

// ==================== ENROLLMENT TOKEN STATUS ====================

/**
 * Check enrollment token status
 */
export async function getEnrollmentTokenStatus(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      enrollmentToken: true,
      enrollmentTokenExpires: true,
      enrollmentStatus: true,
      enrollmentSubmittedAt: true,
      enrollmentSubmissionCount: true,
      applicationStatus: true,
    },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  // Check if admission was completed
  const admissionCompleted = lead.applicationStatus === 'FORM_RECEIVED';

  if (!lead.enrollmentToken) {
    return {
      hasToken: false,
      isExpired: false,
      expiresAt: null,
      wasSubmitted: lead.enrollmentStatus === 'FORM_RECEIVED',
      submittedAt: lead.enrollmentSubmittedAt,
      submissionCount: lead.enrollmentSubmissionCount,
      admissionCompleted,
    };
  }

  const isExpired = lead.enrollmentTokenExpires
    ? new Date() > lead.enrollmentTokenExpires
    : false;

  return {
    hasToken: true,
    isExpired,
    expiresAt: lead.enrollmentTokenExpires,
    wasSubmitted: lead.enrollmentStatus === 'FORM_RECEIVED',
    submittedAt: lead.enrollmentSubmittedAt,
    submissionCount: lead.enrollmentSubmissionCount,
    admissionCompleted,
  };
}

// ==================== REVOKE ENROLLMENT TOKEN ====================

/**
 * Revoke/invalidate an enrollment token
 */
export async function revokeEnrollmentToken(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (lead.enrollmentToken) {
    await prisma.applicationTokenLog.create({
      data: {
        leadId,
        token: lead.enrollmentToken,
        action: 'ENROLLMENT_REVOKED',
      },
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      enrollmentToken: null,
      enrollmentTokenExpires: null,
    },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'ENROLLMENT_LINK_REVOKED',
      actorId: userId,
    },
  });

  return { success: true };
}

// ==================== SEND ENROLLMENT LINK BY EMAIL ====================

/**
 * Send the active enrollment link to the lead's primary contact email
 */
export async function sendEnrollmentLinkByEmail(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      enrollmentToken: true,
      enrollmentTokenExpires: true,
      primaryContactEmail: true,
      primaryContactName: true,
      familyName: true,
    },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (!lead.enrollmentToken || !lead.enrollmentTokenExpires || new Date() > lead.enrollmentTokenExpires) {
    throw new Error('NO_ACTIVE_TOKEN');
  }

  // Cooldown: check for recent email sent in the last 2 minutes
  const cooldownDate = new Date(Date.now() - 2 * 60 * 1000);
  const recentEmail = await prisma.leadHistory.findFirst({
    where: {
      leadId,
      action: 'ENROLLMENT_LINK_EMAILED',
      createdAt: { gte: cooldownDate },
    },
  });

  if (recentEmail) {
    throw new Error('EMAIL_COOLDOWN');
  }

  const hoursLeft = Math.max(1, Math.round((lead.enrollmentTokenExpires.getTime() - Date.now()) / (1000 * 60 * 60)));
  const link = `${process.env.FRONTEND_URL}/enrollment/apply?token=${lead.enrollmentToken}`;

  const recipients = await getNotificationRecipients(leadId);
  const emailTo = recipients.length > 0
    ? recipients.map((r) => r.email)
    : [lead.primaryContactEmail];
  const contactName = recipients.length > 0 ? recipients[0].name : lead.primaryContactName;

  const result = await sendEnrollmentLinkEmail({
    to: emailTo,
    contactName,
    familyName: lead.familyName,
    link,
    expiresInHours: hoursLeft,
  });

  if (!result.success) {
    throw new Error('EMAIL_SEND_FAILED');
  }

  const sentToStr = Array.isArray(emailTo) ? emailTo.join(', ') : emailTo;
  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'ENROLLMENT_LINK_EMAILED',
      actorId: userId,
      details: {
        sentTo: sentToStr,
        expiresAt: lead.enrollmentTokenExpires.toISOString(),
      },
    },
  });

  return { sentTo: sentToStr };
}

// ==================== HELPERS ====================

/**
 * Generate a cryptographically secure token
 * Uses crypto.randomBytes for secure random generation
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Re-export constant for sibling service use
export { MAX_SUBMISSIONS_PER_TOKEN };
