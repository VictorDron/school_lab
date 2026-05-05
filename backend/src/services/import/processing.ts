import * as XLSX from 'xlsx';
import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import { generateCode } from '../../utils/helpers.js';
import { createAuditLog } from '../audit.service.js';
import { COLUMN_MAP } from '../import-mapping.js';
import logger from '../../utils/logger.js';
import type {
  ImportConfirmRequest,
  ImportPreviewResult,
  ImportResult,
  ImportSummary,
  RowError,
} from '../../types/import.types.js';
import { detectDuplicates, detectFamilies } from './detection.js';
import { extractSurname } from './helpers.js';
import { updateImportHistory } from './history.js';
import { parseImportFile, validateRows } from './parsing.js';

const PROGRESS_CHECKPOINT_EVERY = 5;

export async function previewImport(
  buffer: Buffer,
  fileName: string,
  schoolName: string,
): Promise<ImportPreviewResult> {
  const { rows: rawRows, headers } = parseImportFile(buffer, fileName);
  const { parsedRows, errors } = validateRows(rawRows, headers, schoolName);
  const familyGroups = detectFamilies(parsedRows);
  const duplicates = await detectDuplicates(parsedRows);

  const errorRowNumbers = new Set(errors.filter((e) => e.severity === 'error').map((e) => e.row));
  const warningRowNumbers = new Set(errors.filter((e) => e.severity === 'warning').map((e) => e.row));

  const summary: ImportSummary = {
    totalRows: parsedRows.length,
    validRows: parsedRows.filter((r) => !errorRowNumbers.has(r.rowNumber)).length,
    errorRows: errorRowNumbers.size,
    warningRows: warningRowNumbers.size,
    duplicates: duplicates.length,
    familyGroups: familyGroups.filter((f) => f.detectionMethod !== 'SINGLE').length,
    estimatedStudents: parsedRows.length,
    estimatedFamilies: familyGroups.length,
  };

  return { rows: parsedRows, errors, duplicates, familyGroups, summary };
}

/**
 * Background bulk import. Each row runs in its own short transaction so a
 * single failure doesn't roll back hundreds of inserts and Railway's idle-
 * connection killer never trips a long transaction. Progress is flushed
 * to ImportHistory every 5 processed rows so the frontend poller has
 * something to show.
 */
export async function processImportInBackground(
  importHistoryId: string,
  request: ImportConfirmRequest,
  userId: string,
  userEmail: string,
  fileName: string,
): Promise<ImportResult> {
  const { rows, duplicateActions } = request;

  // Imported students drop straight into "Matriculado" — they're not new
  // applicants, they're existing enrollments being backfilled.
  const enrolledColumn = await prisma.kanbanColumn.findFirst({
    where: { slug: 'ENROLLED' },
  });
  const columnId = enrolledColumn?.id ?? '';

  let created = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const importErrors: RowError[] = [];
  const createdStudentIds: string[] = [];

  for (const row of rows) {
    try {
      const action = duplicateActions[row.rowNumber] ?? 'create';

      if (action === 'skip') {
        skipped++;
        continue;
      }

      if (action === 'update') {
        const existingStudent = await prisma.student.findFirst({
          where: {
            OR: [
              {
                fullName: { equals: row.studentName, mode: 'insensitive' },
                grade: row.grade,
              },
            ],
          },
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: existingStudent.id },
            data: {
              grade: row.grade || existingStudent.grade,
            },
          });
          updated++;
        }
        continue;
      }

      // Default: create — single transaction per row (~7 queries)
      const leadCode = generateCode('IMP');
      const studentCode = generateCode('STU');
      const surname = extractSurname(row.studentName);
      const emergencyEmail = row.emergencyContacts[0]?.email;
      const contactEmail = emergencyEmail || `import-${leadCode.toLowerCase()}@sem-email.school-lab.local`;
      const contactName = row.emergencyContacts[0]?.name || surname;

      const student = await prisma.$transaction(
        async (tx) => {
          const lead = await tx.lead.create({
            data: {
              tenantId: requireTenantId(),
              code: leadCode,
              familyName: surname,
              primaryContactName: contactName,
              primaryContactEmail: contactEmail,
              columnId,
              source: 'IMPORT',
              numberOfChildren: 1,
              desiredGrades: row.grade ? [row.grade] : [],
              admissionGateStatus: 'ENROLLED',
              applicationStatus: 'FORM_RECEIVED',
              enrollmentStatus: 'FORM_RECEIVED',
              originType: 'ADMIN_CREATED',
            },
          });

          const leadChild = await tx.leadChild.create({
            data: {
              leadId: lead.id,
              fullName: row.studentName,
              desiredGrade: row.grade || null,
              isApplicant: true,
              studentType: 'CURRENT',
            },
          });

          const healthData = row.health as Record<string, unknown>;
          if (healthData && Object.keys(healthData).length > 0) {
            await tx.leadChildHealth.create({
              data: {
                leadId: lead.id,
                childId: leadChild.id,
                ...healthData,
              } as any,
            });
          }

          const transportData = row.transport as Record<string, unknown>;
          if (transportData && Object.keys(transportData).length > 0) {
            await tx.leadChildTransport.create({
              data: {
                leadId: lead.id,
                childId: leadChild.id,
                ...transportData,
              } as any,
            });
          }

          for (const contact of row.emergencyContacts) {
            await tx.leadEmergencyContact.create({
              data: {
                leadId: lead.id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                isPrimary: contact.isPrimary,
              },
            });
          }

          // LeadHealthPlan is per-lead, not per-child — only the operator
          // field acts as the "is this populated" sentinel.
          const hpData = row.healthPlan as Record<string, unknown>;
          if (hpData && Object.keys(hpData).length > 0 && hpData.operator) {
            await tx.leadHealthPlan.create({
              data: {
                leadId: lead.id,
                ...hpData,
              } as any,
            });
          }

          const eiData = row.enrollmentInfo as Record<string, unknown>;
          if (eiData && Object.keys(eiData).length > 0) {
            await tx.leadEnrollmentInfo.create({
              data: {
                leadId: lead.id,
                childId: leadChild.id,
                ...eiData,
              } as any,
            });
          }

          const newStudent = await tx.student.create({
            data: {
              code: studentCode,
              leadId: lead.id,
              leadChildId: leadChild.id,
              fullName: row.studentName,
              grade: row.grade || null,
              academicYear: new Date().getFullYear(),
              status: 'ACTIVE',
            },
          });

          await tx.studentHistory.create({
            data: {
              studentId: newStudent.id,
              action: 'STUDENT_CREATED',
              details: { method: 'bulk_import', description: 'Aluno criado via importação em massa' },
              actorId: userId,
            },
          });

          return newStudent;
        },
        { maxWait: 15000, timeout: 30000 },
      );

      createdStudentIds.push(student.id);
      created++;
    } catch (rowError) {
      failed++;
      importErrors.push({
        row: row.rowNumber,
        field: '_transaction',
        message: (rowError as Error).message,
        severity: 'error',
      });
      logger.error('Import row failed', {
        row: row.rowNumber,
        error: (rowError as Error).message,
      });
    }

    const processed = created + updated + failed + skipped;
    if (processed % PROGRESS_CHECKPOINT_EVERY === 0 || processed === rows.length) {
      await updateImportHistory(importHistoryId, {
        created,
        updated,
        failed,
        skipped,
      }).catch(() => {
        // Progress update is best-effort — UI polling tolerates stale numbers.
      });
    }
  }

  const finalStatus = failed === rows.length ? 'FAILED' : 'COMPLETED';

  await updateImportHistory(importHistoryId, {
    created,
    updated,
    failed,
    skipped,
    errors: importErrors,
    createdStudentIds,
    status: finalStatus,
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'BULK_IMPORT',
    entityType: 'ImportHistory',
    entityId: importHistoryId,
    metadata: {
      fileName,
      totalRows: rows.length,
      created,
      updated,
      failed,
      skipped,
    },
  });

  return {
    importHistoryId,
    created,
    updated,
    failed,
    skipped,
    errors: importErrors,
    createdStudentIds,
  };
}

/**
 * Build the empty .xlsx template families download to backfill students.
 * Headers concatenate EN + PT so a single column header is unambiguous in
 * either language; the example row gives non-developers a working sample.
 */
export function generateTemplate(): Buffer {
  const headers = COLUMN_MAP.map(
    (col) => `${col.csvHeaderEN}| ${col.csvHeaderPT}`,
  );
  const exampleRow = COLUMN_MAP.map((col) => col.example ?? '');

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
