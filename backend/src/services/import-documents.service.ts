import * as JSZip from 'jszip';
import Fuse from 'fuse.js';
import { prisma } from '../config/database.js';
import { uploadFile } from '../config/supabase.js';
import logger from '../utils/logger.js';

export interface ExtractedDocument {
  folderName: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  matchedStudentId: string | null;
  matchedLeadId: string | null;
  matchedChildId: string | null;
  matchScore: number;
}

interface StudentRef {
  id: string;
  fullName: string;
  leadId: string;
  leadChildId: string;
}

const IGNORED_ENTRIES = ['__MACOSX', '.DS_Store'];

function isIgnoredEntry(path: string): boolean {
  const parts = path.split('/');
  return parts.some(
    (part) =>
      part.startsWith('.') || IGNORED_ENTRIES.some((ignored) => part.includes(ignored)),
  );
}

export function guessMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';

  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return mimeMap[ext] ?? 'application/octet-stream';
}

export async function extractAndMatchDocuments(
  zipBuffer: Buffer,
  students: StudentRef[],
): Promise<{ matched: ExtractedDocument[]; unmatched: ExtractedDocument[] }> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const matched: ExtractedDocument[] = [];
  const unmatched: ExtractedDocument[] = [];

  // Build Fuse index for fuzzy matching
  const fuse = new Fuse(students, {
    keys: ['fullName'],
    threshold: 0.3,
    includeScore: true,
  });

  const entries = Object.entries(zip.files);

  for (const [path, zipEntry] of entries) {
    // Skip directories and ignored files
    if (zipEntry.dir) continue;
    if (isIgnoredEntry(path)) continue;

    const pathParts = path.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : '';

    if (!fileName) continue;

    const buffer = Buffer.from(await zipEntry.async('arraybuffer'));
    const mimeType = guessMimeType(fileName);

    // Try to match folder name to student
    const searchTerm = folderName || fileName.replace(/\.[^.]+$/, '');
    const results = fuse.search(searchTerm);

    if (results.length > 0 && (results[0].score ?? 1) < 0.4) {
      const bestMatch = results[0].item;
      matched.push({
        folderName,
        fileName,
        buffer,
        mimeType,
        matchedStudentId: bestMatch.id,
        matchedLeadId: bestMatch.leadId,
        matchedChildId: bestMatch.leadChildId,
        matchScore: results[0].score ?? 0,
      });
    } else {
      unmatched.push({
        folderName,
        fileName,
        buffer,
        mimeType,
        matchedStudentId: null,
        matchedLeadId: null,
        matchedChildId: null,
        matchScore: results.length > 0 ? (results[0].score ?? 1) : 1,
      });
    }
  }

  return { matched, unmatched };
}

export async function uploadMatchedDocuments(
  documents: ExtractedDocument[],
  userId: string,
): Promise<{
  uploaded: number;
  skipped: number;
  failed: number;
  errors: Array<{ fileName: string; error: string }>;
}> {
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  const errors: Array<{ fileName: string; error: string }> = [];

  for (const doc of documents) {
    if (!doc.matchedStudentId || !doc.matchedLeadId) {
      failed++;
      errors.push({ fileName: doc.fileName, error: 'No matched student' });
      continue;
    }

    try {
      // Duplicate check: same fileName for same lead+child
      const existing = await prisma.leadEnrollmentDocument.findFirst({
        where: {
          leadId: doc.matchedLeadId,
          childId: doc.matchedChildId,
          fileName: doc.fileName,
        },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const storagePath = `imports/${doc.matchedStudentId}/${doc.fileName}`;
      const fileUrl = await uploadFile(doc.buffer, storagePath, doc.mimeType);

      if (!fileUrl) {
        failed++;
        errors.push({ fileName: doc.fileName, error: 'Upload to storage failed' });
        continue;
      }

      await prisma.leadEnrollmentDocument.create({
        data: {
          leadId: doc.matchedLeadId,
          childId: doc.matchedChildId,
          documentType: 'OTHER',
          category: 'STUDENT',
          fileName: doc.fileName,
          fileUrl,
          fileSize: doc.buffer.length,
          mimeType: doc.mimeType,
          status: 'PENDING',
        },
      });

      uploaded++;
    } catch (err) {
      failed++;
      errors.push({
        fileName: doc.fileName,
        error: (err as Error).message,
      });
      logger.error('Failed to upload import document', {
        fileName: doc.fileName,
        studentId: doc.matchedStudentId,
        error: (err as Error).message,
      });
    }
  }

  return { uploaded, skipped, failed, errors };
}
