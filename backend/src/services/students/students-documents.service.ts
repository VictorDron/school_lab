import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import {
  uploadFile,
  deleteFile as deleteFileFromStorage,
} from '../../config/supabase.js';
import logger from '../../utils/logger.js';

export async function uploadStudentDocument(
  studentId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  actorId: string,
  documentType?: string,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw createAppError('STUDENT_NOT_FOUND');

  const storagePath = `students/${studentId}/${Date.now()}-${file.originalname}`;
  const fileUrl = await uploadFile(file.buffer, storagePath, file.mimetype);
  if (!fileUrl) throw createAppError('UPLOAD_FAILED', 'Falha ao enviar documento.');

  const doc = await prisma.leadEnrollmentDocument.create({
    data: {
      leadId: student.leadId,
      childId: student.leadChildId,
      documentType: documentType || 'OTHER',
      category: 'STUDENT',
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'PENDING',
    },
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'DOCUMENT_UPLOADED',
      details: {
        documentId: doc.id,
        fileName: file.originalname,
        documentType: documentType || 'OTHER',
      },
      actorId,
    },
  });

  return doc;
}

export async function reviewStudentDocument(
  studentId: string,
  documentId: string,
  actorId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason?: string,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw createAppError('STUDENT_NOT_FOUND');

  const doc = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc || doc.leadId !== student.leadId) {
    throw createAppError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  const updated = await prisma.leadEnrollmentDocument.update({
    where: { id: documentId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason || null : null,
      reviewedAt: new Date(),
      reviewedBy: actorId,
    },
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
      details: {
        documentId,
        fileName: doc.fileName,
        status,
        rejectionReason: rejectionReason || null,
      },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentDocumentType(
  studentId: string,
  documentId: string,
  documentType: string,
  actorId: string,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw createAppError('STUDENT_NOT_FOUND');

  const doc = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc || doc.leadId !== student.leadId) {
    throw createAppError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  const updated = await prisma.leadEnrollmentDocument.update({
    where: { id: documentId },
    data: { documentType },
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'DOCUMENT_TYPE_CHANGED',
      details: {
        documentId,
        fileName: doc.fileName,
        previousType: doc.documentType,
        newType: documentType,
      },
      actorId,
    },
  });

  return updated;
}

export async function deleteStudentDocument(
  studentId: string,
  documentId: string,
  actorId: string,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw createAppError('STUDENT_NOT_FOUND');

  const doc = await prisma.leadEnrollmentDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc || doc.leadId !== student.leadId) {
    throw createAppError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  try {
    const url = new URL(doc.fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public');
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      const filePath = pathParts.slice(bucketIndex + 2).join('/');
      await deleteFileFromStorage(filePath);
    }
  } catch (err) {
    logger.error('Failed to delete file from storage', {
      documentId,
      error: (err as Error).message,
    });
  }

  await prisma.leadEnrollmentDocument.delete({ where: { id: documentId } });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'DOCUMENT_DELETED',
      details: { documentId, fileName: doc.fileName },
      actorId,
    },
  });
}
