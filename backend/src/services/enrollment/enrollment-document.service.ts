import { prisma } from '../../config/database.js';
import { uploadFile, deleteFile } from '../../config/supabase.js';
import logger from '../../utils/logger.js';
import type { EnrollmentDocumentData } from '../../types/enrollment.types.js';

// ==================== DOCUMENT UPLOAD ====================

/**
 * Upload enrollment document
 */
export async function uploadEnrollmentDocument(
  leadId: string,
  documentData: EnrollmentDocumentData
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const document = await prisma.leadEnrollmentDocument.create({
    data: {
      leadId,
      childId: documentData.childId || null,
      documentType: documentData.documentType,
      category: documentData.category,
      fileName: documentData.fileName,
      fileUrl: documentData.fileUrl,
      fileSize: documentData.fileSize,
      mimeType: documentData.mimeType,
      includesOtherDocs: documentData.includesOtherDocs || [],
      status: 'PENDING',
    },
  });

  return document;
}

/**
 * Delete enrollment document
 * Also deletes the file from Supabase storage
 */
export async function deleteEnrollmentDocument(documentId: string, leadId?: string) {
  const document = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  // Verify document belongs to the lead (security check)
  if (leadId && document.leadId !== leadId) {
    throw new Error('DOCUMENT_NOT_AUTHORIZED');
  }

  // Extract file path from URL to delete from Supabase
  // URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  try {
    const url = new URL(document.fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public');
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      // Get the path after the bucket name
      const filePath = pathParts.slice(bucketIndex + 2).join('/');
      await deleteFile(filePath);
    }
  } catch (err) {
    logger.error('Failed to delete file from storage:', err);
    // Continue with database deletion even if storage deletion fails
  }

  await prisma.leadEnrollmentDocument.delete({
    where: { id: documentId },
  });

  return { success: true };
}

// ==================== REVIEW ENROLLMENT DOCUMENT ====================

/**
 * Review (approve/reject) an enrollment document from the CRM
 */
export async function reviewEnrollmentDocument(
  documentId: string,
  leadId: string,
  reviewerId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string,
  expiryDate?: Date | null,
) {
  const document = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  if (document.leadId !== leadId) {
    throw new Error('DOCUMENT_NOT_AUTHORIZED');
  }

  const updated = await prisma.leadEnrollmentDocument.update({
    where: { id: documentId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? (rejectionReason || null) : null,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      ...(expiryDate !== undefined && { expiryDate }),
    },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: status === 'APPROVED' ? 'ENROLLMENT_DOCUMENT_APPROVED' : 'ENROLLMENT_DOCUMENT_REJECTED',
      actorId: reviewerId,
      details: {
        documentId,
        documentType: document.documentType,
        fileName: document.fileName,
        ...(status === 'REJECTED' && rejectionReason ? { rejectionReason } : {}),
      },
    },
  });

  return updated;
}

// ==================== UPDATE DOCUMENT INCLUDES ====================

// Valid include mappings: which document types can include which other types
const VALID_INCLUDES_MAP: Record<string, string[]> = {
  STUDENT_ID: ['STUDENT_CPF'],
  MOTHER_ID: ['MOTHER_CPF'],
  FATHER_ID: ['FATHER_CPF'],
  FIN_RESP_ID: ['FIN_RESP_CPF'],
};

/**
 * Update the includesOtherDocs field of an enrollment document
 * Used for toggling whether a RG document also contains CPF
 */
export async function updateDocumentIncludes(
  documentId: string,
  leadId: string,
  includesOtherDocs: string[]
) {
  const document = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  if (document.leadId !== leadId) {
    throw new Error('DOCUMENT_NOT_AUTHORIZED');
  }

  // Validate that the includesOtherDocs values are legitimate for this document type
  const allowedIncludes = VALID_INCLUDES_MAP[document.documentType];
  if (!allowedIncludes) {
    throw new Error('DOCUMENT_CANNOT_INCLUDE');
  }

  for (const docType of includesOtherDocs) {
    if (!allowedIncludes.includes(docType)) {
      throw new Error('INVALID_INCLUDE_TYPE');
    }
  }

  const updated = await prisma.leadEnrollmentDocument.update({
    where: { id: documentId },
    data: { includesOtherDocs },
  });

  return {
    id: updated.id,
    documentType: updated.documentType,
    category: updated.category,
    childId: updated.childId,
    fileName: updated.fileName,
    fileUrl: updated.fileUrl,
    fileSize: updated.fileSize,
    mimeType: updated.mimeType,
    includesOtherDocs: updated.includesOtherDocs,
    status: updated.status,
    uploadedAt: updated.uploadedAt.toISOString(),
  };
}

// ==================== BATCH UPLOAD (PUBLIC FORM) ====================

/**
 * Upload multiple enrollment documents via public form.
 * Handles Supabase upload, document limit check, DB records, and history.
 */
export async function uploadEnrollmentDocumentsBatch(
  lead: { id: string },
  files: Array<{ buffer: Buffer; originalname: string; size: number; mimetype: string }>,
  body: { documentType?: string; category?: string; includesOtherDocs?: string; childId?: string }
) {
  const { documentType, category, includesOtherDocs, childId } = body;

  // Check document limit per lead (max 50 documents)
  const existingDocsCount = await prisma.leadEnrollmentDocument.count({
    where: { leadId: lead.id },
  });

  if (existingDocsCount + files.length > 50) {
    throw new Error('DOCUMENT_LIMIT_EXCEEDED');
  }

  // Parse includesOtherDocs safely
  let parsedIncludesOtherDocs: string[] = [];
  if (includesOtherDocs) {
    try {
      parsedIncludesOtherDocs = JSON.parse(includesOtherDocs);
      if (!Array.isArray(parsedIncludesOtherDocs)) {
        parsedIncludesOtherDocs = [];
      }
    } catch {
      parsedIncludesOtherDocs = [];
    }
  }

  const uploadedDocuments = [];

  for (const file of files) {
    const path = `enrollment-documents/${lead.id}/${Date.now()}-${file.originalname}`;
    const fileUrl = await uploadFile(file.buffer, path, file.mimetype);

    if (!fileUrl) {
      logger.error(`Failed to upload file: ${file.originalname}`);
      continue;
    }

    try {
      const document = await uploadEnrollmentDocument(lead.id, {
        documentType: documentType || 'OTHER',
        category: category || 'STUDENT',
        childId: childId || undefined,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        includesOtherDocs: parsedIncludesOtherDocs,
      });

      uploadedDocuments.push(document);
    } catch (dbError) {
      logger.error(`Failed to save document record: ${file.originalname}`, dbError);
      await deleteFile(path).catch(() => {});
    }
  }

  await prisma.leadHistory.create({
    data: {
      leadId: lead.id,
      action: 'ENROLLMENT_DOCUMENTS_UPLOADED',
      details: {
        documentCount: uploadedDocuments.length,
        documentNames: uploadedDocuments.map(d => d.fileName),
        category,
      },
    },
  });

  return uploadedDocuments;
}
