import { prisma } from '../../config/database.js';
import { uploadFile, deleteFile } from '../../config/supabase.js';

export async function uploadDocument(
  leadId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  userId: string,
  documentType?: string,
  documentName?: string,
  childId?: string,
) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const safeName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .substring(0, 255);
  const path = `lead-documents/${leadId}/${Date.now()}-${safeName}`;
  const fileUrl = await uploadFile(file.buffer, path, file.mimetype);

  if (!fileUrl) {
    throw new Error('UPLOAD_FAILED');
  }

  const document = await prisma.leadDocument.create({
    data: {
      leadId,
      name: documentName || file.originalname,
      type: documentType || 'OTHER',
      url: fileUrl,
      size: file.size,
      ...(childId && { childId }),
    },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'DOCUMENT_UPLOADED',
      actorId: userId,
      details: { documentName: document.name, documentType: document.type },
    },
  });

  return document;
}

export async function deleteDocument(
  docId: string,
  leadId: string,
  userId: string,
) {
  const document = await prisma.leadDocument.findFirst({
    where: { id: docId, leadId },
  });

  if (!document) {
    throw new Error('DOCUMENT_NOT_FOUND');
  }

  if (document.url) {
    const path = document.url.split('/').slice(-2).join('/');
    await deleteFile(`lead-documents/${path}`);
  }

  await prisma.leadDocument.delete({ where: { id: docId } });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'DOCUMENT_DELETED',
      actorId: userId,
      details: { documentName: document.name },
    },
  });

  return document;
}
