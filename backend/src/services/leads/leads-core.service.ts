import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import {
  LeadSource,
  CommentType,
  ApplicationStatus,
} from '@prisma/client';
import { generateCode } from '../../utils/helpers.js';
import { deleteFile, refreshDocumentUrl } from '../../config/supabase.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';
import type {
  LeadFilters,
  PaginationParams,
  CreateLeadData,
  UpdateLeadData,
} from './types.js';

/** Limit concurrent Supabase signed-URL refresh calls to avoid connection exhaustion (D-08). */
export const BATCH_SIZE = 5;

export const leadListInclude = {
  column: true,
  children: true,
  _count: { select: { documents: true, comments: true, enrollmentDocuments: true } },
};

export const leadDetailInclude = {
  column: true,
  children: true,
  documents: { orderBy: { uploadedAt: 'desc' as const } },
  enrollmentDocuments: {
    include: { child: { select: { id: true, fullName: true } } },
    orderBy: { uploadedAt: 'desc' as const },
  },
  comments: {
    include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  history: { orderBy: { createdAt: 'desc' as const }, take: 20 },
  creator: { select: { id: true, displayName: true } },
  address: true,
  parents: { orderBy: { parentType: 'asc' as const } },
  additionalInfo: true,
  educationHistory: { orderBy: { orderIndex: 'asc' as const } },
  childrenHealth: { include: { child: { select: { id: true, fullName: true } } } },
  childrenTransport: { include: { child: { select: { id: true, fullName: true } } } },
  emergencyContacts: { orderBy: { isPrimary: 'desc' as const } },
  healthPlan: true,
  transport: true,
  financialResponsible: true,
  enrollmentInfo: { include: { child: { select: { id: true, fullName: true } } } },
  events: {
    include: {
      createdBy: { select: { id: true, displayName: true } },
      assignedTeacher: { select: { id: true, displayName: true } },
      _count: { select: { evaluations: true } },
    },
    orderBy: { startDate: 'desc' as const },
  },
  evaluations: {
    include: {
      child: { select: { id: true, fullName: true } },
      evaluatedBy: { select: { id: true, displayName: true } },
      decisionBy: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

export async function findMany(filters: LeadFilters, pagination: PaginationParams) {
  const where: any = {};

  if (filters.columnId) where.columnId = filters.columnId;
  if (filters.source) {
    where.source = filters.source;
  } else {
    where.source = { not: 'IMPORT' };
  }
  if (filters.flagged) where.isFlagged = true;
  if (filters.search) {
    where.OR = [
      { familyName: { contains: filters.search, mode: 'insensitive' } },
      { primaryContactName: { contains: filters.search, mode: 'insensitive' } },
      { primaryContactEmail: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: leadListInclude,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return { leads, total };
}

export async function findById(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: leadDetailInclude,
  });

  if (!lead) return null;

  if (lead.documents?.length) {
    const refreshed: typeof lead.documents = [];
    for (let i = 0; i < lead.documents.length; i += BATCH_SIZE) {
      const batch = lead.documents.slice(i, i + BATCH_SIZE);
      const batchResult = await Promise.all(
        batch.map(async (doc) => ({
          ...doc,
          url: await refreshDocumentUrl(doc.url),
        })),
      );
      refreshed.push(...batchResult);
    }
    (lead as any).documents = refreshed;
  }

  if (lead.enrollmentDocuments?.length) {
    const refreshed: typeof lead.enrollmentDocuments = [];
    for (let i = 0; i < lead.enrollmentDocuments.length; i += BATCH_SIZE) {
      const batch = lead.enrollmentDocuments.slice(i, i + BATCH_SIZE);
      const batchResult = await Promise.all(
        batch.map(async (doc) => ({
          ...doc,
          fileUrl: await refreshDocumentUrl(doc.fileUrl),
        })),
      );
      refreshed.push(...batchResult);
    }
    (lead as any).enrollmentDocuments = refreshed;
  }

  return lead;
}

export async function getDefaultColumn() {
  return prisma.kanbanColumn.findFirst({
    orderBy: { order: 'asc' },
  });
}

export async function findDuplicates(email: string) {
  return prisma.lead.findMany({
    where: { primaryContactEmail: email },
    select: {
      id: true,
      code: true,
      familyName: true,
      primaryContactName: true,
      admissionGateStatus: true,
      createdAt: true,
    },
    take: 5,
  });
}

export async function create(
  data: CreateLeadData & { force?: boolean },
  userId: string,
) {
  if (!data.force && data.primaryContactEmail) {
    const duplicates = await findDuplicates(data.primaryContactEmail);
    if (duplicates.length > 0) {
      const err = new Error('LEAD_DUPLICATE_EMAIL') as Error & {
        duplicates: typeof duplicates;
      };
      err.duplicates = duplicates;
      throw err;
    }
  }

  let columnId = data.columnId;

  if (!columnId) {
    const firstColumn = await getDefaultColumn();
    if (!firstColumn) {
      throw new Error('NO_COLUMN_FOUND');
    }
    columnId = firstColumn.id;
  }

  const lead = await prisma.lead.create({
    data: {
      tenantId: requireTenantId(),
      code: generateCode('LD'),
      familyName: data.familyName,
      primaryContactName: data.primaryContactName,
      primaryContactEmail: data.primaryContactEmail,
      primaryContactPhone: data.primaryContactPhone,
      secondaryContactName: data.secondaryContactName,
      secondaryContactEmail: data.secondaryContactEmail,
      secondaryContactPhone: data.secondaryContactPhone,
      numberOfChildren: data.numberOfChildren || 1,
      desiredGrades: data.desiredGrades || [],
      source: data.source || 'OTHER',
      notes: data.notes,
      columnId,
      createdById: userId,
      originType: 'ADMIN_CREATED',
      applicationStatus: 'PENDING',
    },
    include: { column: true, children: true },
  });

  await prisma.leadHistory.create({
    data: {
      leadId: lead.id,
      action: 'CREATED',
      actorId: userId,
    },
  });

  try {
    await redis.publish(
      'crm:leads:list',
      JSON.stringify({ type: 'lead:created', leadId: lead.id }),
    );
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return lead;
}

export async function update(id: string, data: UpdateLeadData, userId: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const updated = await prisma.lead.update({
    where: { id },
    data,
    include: { column: true, children: true },
  });

  await prisma.leadHistory.create({
    data: {
      leadId: lead.id,
      action: 'UPDATED',
      actorId: userId,
      details: { changes: Object.keys(data) },
    },
  });

  try {
    await redis.publish(
      'crm:leads:list',
      JSON.stringify({ type: 'lead:updated', leadId: id }),
    );
    getIO().to(`lead:${id}`).emit('crm:lead:updated', { leadId: id });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return updated;
}

export async function remove(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  for (const doc of lead.documents) {
    if (doc.url) {
      const path = doc.url.split('/').slice(-2).join('/');
      await deleteFile(`lead-documents/${path}`);
    }
  }

  await prisma.lead.delete({ where: { id } });

  try {
    await redis.publish(
      'crm:leads:list',
      JSON.stringify({ type: 'lead:deleted', leadId: id }),
    );
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return lead;
}

export async function updateColumn(id: string, columnId: string, userId: string) {
  const [lead, targetColumn] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: { column: true },
    }),
    prisma.kanbanColumn.findUnique({ where: { id: columnId } }),
  ]);

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  if (!targetColumn) {
    throw new Error('COLUMN_NOT_FOUND');
  }

  const previousColumn = lead.column;

  const updated = await prisma.lead.update({
    where: { id },
    data: { columnId },
    include: { column: true },
  });

  await prisma.leadHistory.create({
    data: {
      leadId: lead.id,
      action: 'STATUS_CHANGED',
      actorId: userId,
      details: {
        previousColumn: { id: previousColumn.id, name: previousColumn.name },
        newColumn: { id: targetColumn.id, name: targetColumn.name },
      },
    },
  });

  try {
    await redis.publish(
      'crm:leads:list',
      JSON.stringify({ type: 'lead:column-moved', leadId: id, columnId }),
    );
    getIO().to(`lead:${id}`).emit('crm:lead:updated', { leadId: id });
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return { updated, previousColumn, targetColumn };
}

export async function toggleFlag(id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: { isFlagged: !lead.isFlagged },
  });

  try {
    await redis.publish(
      'crm:leads:list',
      JSON.stringify({ type: 'lead:updated', leadId: id }),
    );
  } catch (err) {
    logger.warn('CRM event publish failed:', err);
  }

  return updated;
}

export async function addComment(
  leadId: string,
  userId: string,
  content: string,
  type: CommentType = 'GENERAL',
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  return prisma.leadComment.create({
    data: {
      leadId,
      userId,
      content,
      type,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function deleteComment(commentId: string, leadId: string) {
  const comment = await prisma.leadComment.findFirst({
    where: { id: commentId, leadId },
  });

  if (!comment) {
    throw new Error('COMMENT_NOT_FOUND');
  }

  await prisma.leadComment.delete({ where: { id: commentId } });

  return comment;
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  userId: string,
) {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const previousStatus = lead.applicationStatus;

  const updated = await prisma.lead.update({
    where: { id },
    data: { applicationStatus: status },
    include: { column: true, children: true },
  });

  await prisma.leadHistory.create({
    data: {
      leadId: id,
      action: 'APPLICATION_STATUS_CHANGED',
      actorId: userId,
      details: {
        previousStatus,
        newStatus: status,
      },
    },
  });

  return updated;
}

export type { LeadSource };
