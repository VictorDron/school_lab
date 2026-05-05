import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { createAppError } from '../lib/error-messages.js';
import { redis } from '../config/redis.js';
import { getIO } from '../socket/io.js';
import logger from '../utils/logger.js';

const STATUS_TIMESTAMP_MAP: Record<string, string> = {
  SENT: 'sentAt',
  OPENED: 'openedAt',
  CONFIRMED: 'confirmedAt',
  DECLINED: 'declinedAt',
  EXPIRED: 'expiredAt',
};

export interface InviteFilters {
  status?: string;
  gateStatus?: string;
  grade?: string;
}

export interface InvitePagination {
  page: number;
  limit: number;
}

export async function createInvite(periodId: string, studentId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  if (period.status !== 'OPEN') {
    throw createAppError('PERIOD_NOT_OPEN');
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    throw createAppError('STUDENT_NOT_FOUND');
  }

  const existing = await prisma.reEnrollmentInvite.findFirst({
    where: { periodId, studentId },
  });

  if (existing) {
    throw createAppError('INVITE_ALREADY_EXISTS');
  }

  const token = crypto.randomBytes(32).toString('hex');

  const invite = await prisma.reEnrollmentInvite.create({
    data: {
      tenantId: period.tenantId,
      periodId,
      studentId,
      token,
      status: 'SENT',
      sentAt: new Date(),
      gateStatus: 'CONVITE_ENVIADO',
    },
  });

  try {
    await redis.publish(
      're-enrollment:invites',
      JSON.stringify({ type: 'invite:created', inviteId: invite.id, periodId }),
    );
    getIO()
      .to(`re-enrollment:${periodId}`)
      .emit('re-enrollment:invite:created', { inviteId: invite.id });
  } catch (err) {
    logger.warn('Re-enrollment invite event publish failed:', err);
  }

  return invite;
}

/**
 * Create invite for a student — race-safe via unique constraint.
 * Used by auto-invite after pre-enrollment AGREED response.
 */
export async function createInviteForStudent(periodId: string, studentId: string) {
  const token = crypto.randomBytes(32).toString('hex');

  return prisma.reEnrollmentInvite.upsert({
    where: { periodId_studentId: { periodId, studentId } },
    update: {},
    create: {
      tenantId: requireTenantId(),
      periodId,
      studentId,
      token,
      status: 'SENT',
      sentAt: new Date(),
      gateStatus: 'CONVITE_ENVIADO',
    },
  });
}

export async function findInviteByToken(token: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { token },
    include: { student: true, period: true },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  return invite;
}

export async function updateInviteStatus(inviteId: string, newStatus: string) {
  const timestampField = STATUS_TIMESTAMP_MAP[newStatus];

  const data: Record<string, unknown> = { status: newStatus };

  if (timestampField) {
    data[timestampField] = new Date();
  }

  return prisma.reEnrollmentInvite.update({
    where: { id: inviteId },
    data,
  });
}

export async function updateInviteEmailStatus(
  inviteId: string,
  status: string,
  error?: string,
) {
  await prisma.reEnrollmentInvite.update({
    where: { id: inviteId },
    data: {
      emailStatus: status,
      ...(error && { emailError: error }),
      ...(status === 'SENT' && { emailSentAt: new Date() }),
    },
  });
}

/**
 * Returns the most recent non-cancelled RENEWAL contract attached to the
 * lead behind a given invite, or null when the family has no contract yet.
 * Used by the controller to render the contract panel on the invite detail.
 */
export async function getInviteRenewalContract(inviteId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    select: { studentId: true, student: { select: { leadId: true } } },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  return prisma.contract.findFirst({
    where: {
      leadId: invite.student.leadId,
      enrollmentType: 'RENEWAL',
      status: { not: 'CANCELLED' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      signers: {
        select: { id: true, name: true, email: true, role: true, signedAt: true },
      },
    },
  });
}

/**
 * Lists every enrollment document filed for the lead/child behind a given
 * invite. The wave 1 split moved this read off the controller so HTTP code
 * stops talking to Prisma directly.
 */
export async function listInviteDocuments(inviteId: string) {
  const invite = await prisma.reEnrollmentInvite.findUnique({
    where: { id: inviteId },
    select: { student: { select: { leadId: true, leadChildId: true } } },
  });

  if (!invite) {
    throw createAppError('INVITE_NOT_FOUND');
  }

  return prisma.leadEnrollmentDocument.findMany({
    where: {
      leadId: invite.student.leadId,
      ...(invite.student.leadChildId
        ? { childId: invite.student.leadChildId }
        : {}),
    },
    orderBy: { uploadedAt: 'desc' },
    select: {
      id: true,
      documentType: true,
      category: true,
      fileName: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      status: true,
      rejectionReason: true,
      uploadedAt: true,
      reviewedAt: true,
    },
  });
}

export async function findManyInvitesByPeriod(
  periodId: string,
  filters: InviteFilters = {},
  pagination: InvitePagination = { page: 1, limit: 25 },
) {
  const where: Record<string, unknown> = { periodId };

  if (filters.status) where.status = filters.status;
  if (filters.gateStatus) where.gateStatus = filters.gateStatus;
  if (filters.grade) where.student = { grade: filters.grade };

  const skip = (pagination.page - 1) * pagination.limit;

  const [data, total] = await Promise.all([
    prisma.reEnrollmentInvite.findMany({
      where,
      include: {
        student: {
          include: {
            lead: {
              select: {
                id: true,
                contracts: {
                  where: {
                    enrollmentType: 'RENEWAL',
                    status: { not: 'CANCELLED' },
                  },
                  orderBy: { createdAt: 'desc' as const },
                  take: 1,
                  select: {
                    id: true,
                    code: true,
                    status: true,
                    clicksignStatus: true,
                    sentAt: true,
                    signedAt: true,
                    documentUrl: true,
                    signedDocumentUrl: true,
                    signers: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        hasSigned: true,
                        signedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reEnrollmentInvite.count({ where }),
  ]);

  return { data, total, page: pagination.page, limit: pagination.limit };
}
