import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { uploadFile, deleteFile } from '../config/supabase.js';
import { createAuditLog } from './audit.service.js';
import { DocumentSecurityLevel, AppModule } from '@prisma/client';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// ==================== TYPES ====================

export interface DocumentFilters {
  module?: AppModule;
  securityLevel?: DocumentSecurityLevel;
  search?: string;
}

export interface DocumentPagination {
  page: number;
  limit: number;
  skip: number;
}

export interface UploadDocumentData {
  title?: string;
  description?: string;
  module?: string;
  securityLevel?: string;
  tags?: string;
}

export interface UpdateDocumentData {
  title?: string;
  description?: string;
  module?: string;
  securityLevel?: string;
  tags?: string[];
}

interface DocumentUser {
  id: string;
  role: string;
}

// ==================== ACCESS CONTROL ====================

export function canViewDocument(user: DocumentUser, doc: { securityLevel: DocumentSecurityLevel; uploadedById: string }): boolean {
  if (user.role === 'ADMIN') return true;
  if (doc.securityLevel === 'PUBLIC') return true;
  if (doc.securityLevel === 'INTERNAL') return true;
  if (['SENSITIVE', 'RESTRICTED', 'CONFIDENTIAL'].includes(doc.securityLevel)) {
    return ['ADMIN', 'MANAGER'].includes(user.role);
  }
  return doc.uploadedById === user.id;
}

// ==================== QUERIES ====================

export async function listDocuments(
  filters: DocumentFilters,
  pagination: DocumentPagination,
  user: DocumentUser,
) {
  const where: any = { isArchived: false };
  if (filters.module) where.module = filters.module;
  if (filters.securityLevel) where.securityLevel = filters.securityLevel;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { tags: { has: filters.search } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.document.count({ where }),
  ]);

  const accessible = documents.filter((doc) => canViewDocument(user, doc));

  return {
    data: accessible,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: accessible.length,
      totalPages: Math.ceil(total / pagination.limit),
    },
  };
}

export async function getDocumentById(
  id: string,
  user: DocumentUser,
  actorEmail: string,
) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { id: true, displayName: true, email: true, avatarUrl: true } },
    },
  });

  if (!document) return { error: 'NOT_FOUND' as const };
  if (!canViewDocument(user, document)) return { error: 'ACCESS_DENIED' as const };

  await createAuditLog({
    actorId: user.id,
    actorEmail,
    action: 'DOCUMENT_VIEWED',
    entityType: 'DOCUMENT',
    entityId: document.id,
  });

  return { data: document };
}

// ==================== AI ANALYSIS ====================

async function analyzeDocumentWithAI(buffer: Buffer, mimetype: string) {
  if (!['application/pdf', 'text/plain'].includes(mimetype)) return null;

  try {
    const content = buffer.toString('utf-8').substring(0, 4000);
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Analyze this document and provide: 1) A suggested title 2) A brief description 3) Suggested tags (comma-separated) 4) Suggested security level (PUBLIC, INTERNAL, SENSITIVE, RESTRICTED, or CONFIDENTIAL). Respond in JSON format.',
        },
        { role: 'user', content },
      ],
      max_tokens: 500,
    });

    const aiContent = response.choices[0]?.message?.content;
    if (aiContent) return JSON.parse(aiContent);
  } catch (aiError) {
    logger.error('AI analysis error:', aiError);
  }

  return null;
}

// ==================== MUTATIONS ====================

export async function uploadDocument(
  file: { buffer: Buffer; originalname: string; size: number; mimetype: string },
  body: UploadDocumentData,
  actorId: string,
  actorEmail: string,
) {
  const parsedTags = body.tags ? JSON.parse(body.tags) : [];

  // Upload to Supabase
  const path = `documents/${actorId}/${Date.now()}-${file.originalname}`;
  const fileUrl = await uploadFile(file.buffer, path, file.mimetype);

  if (!fileUrl) return { error: 'UPLOAD_FAILED' as const };

  // AI analysis for supported file types
  const aiAnalysis = await analyzeDocumentWithAI(file.buffer, file.mimetype);

  const document = await prisma.document.create({
    data: {
      tenantId: requireTenantId(),
      title: body.title || aiAnalysis?.title || file.originalname,
      description: body.description || aiAnalysis?.description,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      module: (body.module as AppModule) || undefined,
      securityLevel:
        (body.securityLevel as DocumentSecurityLevel) || aiAnalysis?.securityLevel || 'INTERNAL',
      tags:
        parsedTags.length > 0
          ? parsedTags
          : aiAnalysis?.tags?.split(',').map((t: string) => t.trim()) || [],
      aiAnalysis,
      uploadedById: actorId,
    },
    include: {
      uploadedBy: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: document.id,
    metadata: { fileName: document.fileName, securityLevel: document.securityLevel },
  });

  return { data: document };
}

export async function updateDocument(
  id: string,
  data: UpdateDocumentData,
  actorId: string,
  actorEmail: string,
  actorRole: string,
) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return { error: 'NOT_FOUND' as const };

  if (document.uploadedById !== actorId && actorRole !== 'ADMIN') {
    return { error: 'ACCESS_DENIED' as const };
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      module: data.module as AppModule | undefined,
      securityLevel: data.securityLevel as DocumentSecurityLevel | undefined,
      tags: data.tags,
    },
  });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'DOCUMENT_UPDATED',
    entityType: 'DOCUMENT',
    entityId: document.id,
  });

  return { data: updated };
}

export async function deleteDocument(
  id: string,
  actorId: string,
  actorEmail: string,
  actorRole: string,
) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return { error: 'NOT_FOUND' as const };

  if (document.uploadedById !== actorId && actorRole !== 'ADMIN') {
    return { error: 'ACCESS_DENIED' as const };
  }

  // Delete from storage
  const filePath = document.fileUrl.split('/').pop();
  if (filePath) {
    await deleteFile(`documents/${document.uploadedById}/${filePath}`);
  }

  await prisma.document.delete({ where: { id } });

  await createAuditLog({
    actorId,
    actorEmail,
    action: 'DOCUMENT_DELETED',
    entityType: 'DOCUMENT',
    entityId: document.id,
    metadata: { fileName: document.fileName },
  });

  return { success: true };
}
