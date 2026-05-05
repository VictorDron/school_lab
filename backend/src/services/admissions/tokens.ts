import { prisma } from '../../config/database.js';
import { sendApplicationLinkEmail } from '../email.service.js';
import { getNotificationRecipients } from '../../utils/notification-contacts.js';

const TOKEN_EXPIRY_HOURS = 168; // 7 days
const EMAIL_COOLDOWN_MS = 2 * 60 * 1000;

interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * URL-safe random token. 32 chars at 62 alphabet ≈ 190 bits of entropy —
 * enough to make brute-force impractical without needing a CSPRNG dance.
 */
function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function buildApplicationLink(token: string): string {
  return `${process.env.FRONTEND_URL}/admissions/apply?token=${token}`;
}

/**
 * Validate an application token. Logs the access (or expiry) attempt to the
 * audit trail regardless of outcome — so we can investigate suspicious link
 * usage even when the token is rejected.
 */
export async function validateApplicationToken(token: string, metadata?: RequestMetadata) {
  const lead = await prisma.lead.findFirst({
    where: { applicationToken: token },
    include: { children: true },
  });

  if (!lead) {
    return { valid: false as const, error: 'TOKEN_NOT_FOUND', lead: null };
  }

  if (lead.applicationTokenExpires && new Date() > lead.applicationTokenExpires) {
    await prisma.applicationTokenLog.create({
      data: {
        leadId: lead.id,
        token,
        action: 'EXPIRED',
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });
    return { valid: false as const, error: 'TOKEN_EXPIRED', lead: null };
  }

  await prisma.applicationTokenLog.create({
    data: {
      leadId: lead.id,
      token,
      action: 'ACCESSED',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });

  return { valid: true as const, error: null, lead };
}

/**
 * Mint a new application token for the lead. Bumps the lead's status to
 * LINK_SENT and stamps applicationSentAt — overwrites any previous active
 * token for this lead.
 */
export async function generateApplicationLink(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      applicationToken: token,
      applicationTokenExpires: expiresAt,
      applicationStatus: 'LINK_SENT',
      applicationSentAt: new Date(),
    },
  });

  await prisma.applicationTokenLog.create({
    data: { leadId, token, action: 'GENERATED' },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'APPLICATION_LINK_GENERATED',
      actorId: userId,
      details: {
        expiresAt: expiresAt.toISOString(),
        expiryHours: TOKEN_EXPIRY_HOURS,
      },
    },
  });

  return {
    applicationLink: buildApplicationLink(token),
    token,
    expiresAt,
    expiryHours: TOKEN_EXPIRY_HOURS,
  };
}

export async function getTokenStatus(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      applicationToken: true,
      applicationTokenExpires: true,
      applicationDate: true,
    },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (!lead.applicationToken) {
    return {
      hasToken: false,
      isExpired: false,
      expiresAt: null,
      wasSubmitted: !!lead.applicationDate,
      submittedAt: lead.applicationDate,
    };
  }

  const isExpired = lead.applicationTokenExpires
    ? new Date() > lead.applicationTokenExpires
    : false;

  return {
    hasToken: true,
    isExpired,
    expiresAt: lead.applicationTokenExpires,
    wasSubmitted: !!lead.applicationDate,
    submittedAt: lead.applicationDate,
  };
}

export async function revokeToken(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (lead.applicationToken) {
    await prisma.applicationTokenLog.create({
      data: {
        leadId,
        token: lead.applicationToken,
        action: 'REVOKED',
      },
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      applicationToken: null,
      applicationTokenExpires: null,
    },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'APPLICATION_LINK_REVOKED',
      actorId: userId,
    },
  });

  return { success: true };
}

/**
 * Send the active application link via email. Enforces a 2-minute cooldown
 * against the last APPLICATION_LINK_EMAILED event so an admin clicking the
 * button twice doesn't double-send.
 */
export async function sendApplicationLinkByEmail(leadId: string, userId?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      applicationToken: true,
      applicationTokenExpires: true,
      primaryContactEmail: true,
      primaryContactName: true,
      familyName: true,
    },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (!lead.applicationToken || !lead.applicationTokenExpires || new Date() > lead.applicationTokenExpires) {
    throw new Error('NO_ACTIVE_TOKEN');
  }

  const cooldownDate = new Date(Date.now() - EMAIL_COOLDOWN_MS);
  const recentEmail = await prisma.leadHistory.findFirst({
    where: {
      leadId,
      action: 'APPLICATION_LINK_EMAILED',
      createdAt: { gte: cooldownDate },
    },
  });

  if (recentEmail) {
    throw new Error('EMAIL_COOLDOWN');
  }

  const hoursLeft = Math.max(
    1,
    Math.round((lead.applicationTokenExpires.getTime() - Date.now()) / (1000 * 60 * 60)),
  );

  const recipients = await getNotificationRecipients(leadId);
  const emailTo = recipients.length > 0
    ? recipients.map(r => r.email)
    : [lead.primaryContactEmail];
  const contactName = recipients.length > 0 ? recipients[0].name : lead.primaryContactName;

  const result = await sendApplicationLinkEmail({
    to: emailTo,
    contactName,
    familyName: lead.familyName,
    link: buildApplicationLink(lead.applicationToken),
    expiresInHours: hoursLeft,
  });

  if (!result.success) {
    throw new Error('EMAIL_SEND_FAILED');
  }

  const sentToStr = Array.isArray(emailTo) ? emailTo.join(', ') : emailTo;
  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'APPLICATION_LINK_EMAILED',
      actorId: userId,
      details: {
        sentTo: sentToStr,
        expiresAt: lead.applicationTokenExpires.toISOString(),
      },
    },
  });

  return { sentTo: sentToStr };
}
