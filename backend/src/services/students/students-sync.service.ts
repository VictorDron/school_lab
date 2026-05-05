import { prisma } from '../../config/database.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';
import { generateCode } from '../../utils/helpers.js';
import { VALID_GRADES } from '../grade-progression.js';
import logger from '../../utils/logger.js';

/** Fields shared between Student and LeadChild that must stay in sync. */
const SYNC_FIELDS = [
  'fullName',
  'dateOfBirth',
  'cpf',
  'gender',
  'nationality',
] as const;

/**
 * Sync Student basic fields to corresponding LeadChild.
 * Called after Student data is updated to prevent divergence.
 */
export async function syncStudentToLeadChild(
  studentId: string,
  changedFields: Record<string, unknown>,
) {
  const syncData: Record<string, unknown> = {};
  for (const field of SYNC_FIELDS) {
    if (field in changedFields) {
      syncData[field] = changedFields[field];
    }
  }
  if (Object.keys(syncData).length === 0) return;

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { leadChildId: true },
    });
    if (!student) return;

    await prisma.leadChild.update({
      where: { id: student.leadChildId },
      data: syncData,
    });
    logger.debug('Synced Student → LeadChild', {
      studentId,
      fields: Object.keys(syncData),
    });
  } catch (err) {
    logger.warn('Failed to sync Student → LeadChild', {
      studentId,
      error: (err as Error).message,
    });
  }
}

/**
 * Sync LeadChild basic fields to corresponding active Student(s).
 * Called after LeadChild data is updated to prevent divergence.
 */
export async function syncLeadChildToStudents(
  childId: string,
  changedFields: Record<string, unknown>,
) {
  const syncData: Record<string, unknown> = {};
  for (const field of SYNC_FIELDS) {
    if (field in changedFields) {
      syncData[field] = changedFields[field];
    }
  }
  if (Object.keys(syncData).length === 0) return;

  try {
    const students = await prisma.student.findMany({
      where: { leadChildId: childId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (students.length === 0) return;

    await prisma.student.updateMany({
      where: { leadChildId: childId, status: 'ACTIVE' },
      data: syncData,
    });
    logger.debug('Synced LeadChild → Students', {
      childId,
      studentIds: students.map((s) => s.id),
      fields: Object.keys(syncData),
    });
  } catch (err) {
    logger.warn('Failed to sync LeadChild → Students', {
      childId,
      error: (err as Error).message,
    });
  }
}

/**
 * Create Student records for all applicable children of a lead.
 * Idempotent: findFirst + conditional create on (leadChildId, academicYear) composite unique.
 * Only creates students for children where isApplicant: true (D-02).
 */
export async function createStudentsFromEnrollment(
  leadId: string,
  actorId?: string,
) {
  // Look up the Lead's tenantId once so each Student inherits the right
  // tenant. Auto-scope on Lead means a wrong-tenant leadId returns null.
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { tenantId: true },
  });
  if (!lead) {
    logger.warn('createStudentsFromEnrollment: lead not found', { leadId });
    return [];
  }

  const applicantChildren = await prisma.leadChild.findMany({
    where: { leadId, isApplicant: true },
  });

  const createdStudents = [];

  for (const child of applicantChildren) {
    const currentYear = new Date().getFullYear();

    let student = await prisma.student.findFirst({
      where: { leadChildId: child.id, academicYear: currentYear },
    });

    if (!student) {
      const grade =
        child.desiredGrade && VALID_GRADES.has(child.desiredGrade)
          ? child.desiredGrade
          : null;
      if (child.desiredGrade && !VALID_GRADES.has(child.desiredGrade)) {
        logger.warn('Invalid grade during student creation, setting to null', {
          leadId,
          childId: child.id,
          invalidGrade: child.desiredGrade,
        });
      }

      student = await prisma.student.create({
        data: {
          tenantId: lead.tenantId,
          code: generateCode('STU'),
          leadId,
          leadChildId: child.id,
          fullName: child.fullName,
          dateOfBirth: child.dateOfBirth ?? undefined,
          cpf: child.cpf ?? undefined,
          gender: child.gender ?? undefined,
          nationality: child.nationality ?? undefined,
          grade,
          academicYear: currentYear,
          status: 'ACTIVE',
        },
      });
    }

    const existingHistory = await prisma.studentHistory.findFirst({
      where: { studentId: student.id, action: 'STUDENT_CREATED' },
    });

    if (!existingHistory) {
      await prisma.studentHistory.create({
        data: {
          studentId: student.id,
          action: 'STUDENT_CREATED',
          details: { leadId, leadChildId: child.id },
          actorId: actorId ?? null,
        },
      });
    }

    createdStudents.push(student);
  }

  try {
    await redis.publish(
      'students:list',
      JSON.stringify({ type: 'student:created', leadId }),
    );
  } catch (err) {
    logger.warn('Redis publish failed for student:created', {
      leadId,
      error: (err as Error).message,
    });
  }

  try {
    getIO()
      .to('students:list')
      .emit('students:list:updated', { type: 'student:created', leadId });
  } catch (err) {
    logger.warn('Socket emit failed for student:created', {
      leadId,
      error: (err as Error).message,
    });
  }

  return createdStudents;
}

/**
 * Creates a NEW Student record for the next academic year via re-enrollment.
 * Idempotent: if a student already exists for (leadChildId, targetYear), returns it.
 * The original student record is preserved — historical data per year is maintained.
 * Links new record to previous via previousStudentId.
 */
export async function createStudentFromReEnrollment(
  currentStudent: {
    id: string;
    leadId: string;
    leadChildId: string;
    fullName: string;
    dateOfBirth: Date | null;
    cpf: string | null;
    gender: string | null;
    nationality: string | null;
    grade: string | null;
  },
  targetYear: number,
  nextGrade: string | null,
) {
  const existing = await prisma.student.findFirst({
    where: {
      leadChildId: currentStudent.leadChildId,
      academicYear: targetYear,
    },
  });
  if (existing) return existing;

  const validatedGrade =
    nextGrade && VALID_GRADES.has(nextGrade) ? nextGrade : currentStudent.grade;
  const previousGrade = currentStudent.grade;

  // Look up the Lead's tenantId — auto-scope on Lead protects against
  // cross-tenant leadId injection.
  const lead = await prisma.lead.findUnique({
    where: { id: currentStudent.leadId },
    select: { tenantId: true },
  });
  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  const promoted = await prisma.student.create({
    data: {
      tenantId: lead.tenantId,
      code: generateCode('STU'),
      leadId: currentStudent.leadId,
      leadChildId: currentStudent.leadChildId,
      fullName: currentStudent.fullName,
      dateOfBirth: currentStudent.dateOfBirth ?? undefined,
      cpf: currentStudent.cpf ?? undefined,
      gender: currentStudent.gender ?? undefined,
      nationality: currentStudent.nationality ?? undefined,
      grade: validatedGrade,
      academicYear: targetYear,
      previousStudentId: currentStudent.id,
      status: 'ACTIVE',
    },
  });

  await prisma.studentHistory.create({
    data: {
      studentId: promoted.id,
      action: 'STUDENT_CREATED',
      details: {
        source: 'RE_ENROLLMENT',
        previousStudentId: currentStudent.id,
        previousGrade,
        newGrade: validatedGrade,
        previousYear: targetYear - 1,
        newYear: targetYear,
      },
    },
  });

  await prisma.studentHistory.create({
    data: {
      studentId: currentStudent.id,
      action: 'RE_ENROLLED',
      details: {
        newStudentId: promoted.id,
        newGrade: validatedGrade,
        newYear: targetYear,
      },
    },
  });

  try {
    await redis.publish(
      'students:list',
      JSON.stringify({
        type: 'student:created',
        leadId: currentStudent.leadId,
        source: 'RE_ENROLLMENT',
      }),
    );
  } catch (err) {
    logger.warn('Redis publish failed for re-enrollment student creation', {
      error: (err as Error).message,
    });
  }
  try {
    getIO()
      .to('students:list')
      .emit('students:list:updated', {
        type: 'student:created',
        leadId: currentStudent.leadId,
      });
  } catch (err) {
    logger.warn('Socket emit failed for re-enrollment student creation', {
      error: (err as Error).message,
    });
  }

  return promoted;
}
