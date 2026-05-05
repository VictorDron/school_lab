import { prisma } from '../../config/database.js';
import { uploadFile, deleteFile } from '../../config/supabase.js';
import logger from '../../utils/logger.js';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  size: number;
  mimetype: string;
}

interface UploadBody {
  documentType?: string;
  childId?: string;
  childIndex?: string;
}

/**
 * Upload one or more documents from the public application form. Each file
 * is uploaded to Supabase first; on storage failure we log and skip — never
 * create a DB row pointing at a missing object. When `documentType` is set,
 * any matching pending document request flips to RECEIVED.
 */
export async function uploadApplicationDocuments(
  lead: { id: string },
  files: UploadedFile[],
  body: UploadBody,
) {
  const { documentType, childId, childIndex } = body;
  const uploadedDocuments = [];

  for (const file of files) {
    const path = `lead-documents/${lead.id}/${Date.now()}-${file.originalname}`;
    const fileUrl = await uploadFile(file.buffer, path, file.mimetype);

    if (!fileUrl) {
      logger.error(`Failed to upload file: ${file.originalname}`);
      continue;
    }

    const document = await prisma.leadDocument.create({
      data: {
        leadId: lead.id,
        name: file.originalname,
        type: documentType || 'OTHER',
        url: fileUrl,
        size: file.size,
        uploadedBy: 'FAMILY',
        uploadedVia: 'PUBLIC_FORM',
        childId: childId || null,
        childIndex: childIndex != null ? parseInt(childIndex) : null,
      },
    });

    uploadedDocuments.push(document);

    if (documentType) {
      await prisma.leadDocumentRequest.updateMany({
        where: {
          leadId: lead.id,
          documentType,
          childId: childId || null,
          status: 'PENDING',
        },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
        },
      });
    }
  }

  await prisma.leadHistory.create({
    data: {
      leadId: lead.id,
      action: 'DOCUMENTS_UPLOADED_VIA_PUBLIC_FORM',
      details: {
        documentCount: uploadedDocuments.length,
        documentNames: uploadedDocuments.map(d => d.name),
      },
    },
  });

  return uploadedDocuments;
}

export async function getApplicationDocuments(leadId: string) {
  const [documents, documentRequests] = await Promise.all([
    prisma.leadDocument.findMany({
      where: { leadId },
      orderBy: { uploadedAt: 'desc' },
    }),
    prisma.leadDocumentRequest.findMany({
      where: { leadId },
      include: { child: { select: { id: true, fullName: true } } },
      orderBy: { requestedAt: 'desc' },
    }),
  ]);

  return { documents, documentRequests };
}

/**
 * Delete a document. Storage failures are logged but not fatal — the DB row
 * is removed regardless, so the orphaned blob can be cleaned by a sweeper.
 * Authorizes by leadId match to prevent cross-lead deletion via guessed ids.
 */
export async function deleteApplicationDocument(leadId: string, documentId: string) {
  const document = await prisma.leadDocument.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  if (document.leadId !== leadId) {
    throw new Error('DOCUMENT_NOT_AUTHORIZED');
  }

  if (document.url) {
    const urlParts = document.url.split('/lead-documents/');
    if (urlParts.length > 1) {
      const storagePath = `lead-documents/${urlParts[1]}`;
      await deleteFile(storagePath).catch(err => {
        logger.error('Failed to delete file from storage:', err);
      });
    }
  }

  await prisma.leadDocument.delete({
    where: { id: documentId },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'DOCUMENT_DELETED_VIA_PUBLIC_FORM',
      details: {
        documentName: document.name,
        documentType: document.type,
      },
    },
  });
}
