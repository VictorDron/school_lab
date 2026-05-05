import { Prisma, StudentStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { withTenantTx } from '../../lib/tenant-context.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/io.js';
import { createAppError } from '../../lib/error-messages.js';
import { createAuditLog } from '../audit.service.js';
import { uploadFile } from '../../config/supabase.js';
import { GRADE_ORDER, VALID_GRADES } from '../grade-progression.js';
import { syncStudentToLeadChild } from './students-sync.service.js';
import logger from '../../utils/logger.js';

export interface StudentFilters {
  search?: string;
  grade?: string;
  academicYear?: number;
  status?: StudentStatus;
  parentName?: string;
  enrolledAfter?: string;
  enrolledBefore?: string;
  ageMin?: number;
  ageMax?: number;
  sortBy?: 'fullName' | 'grade' | 'enrolledAt' | 'status' | 'academicYear';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface StudentAlerts {
  pendingDocs: boolean;
  contractExpiring: boolean;
  reEnrollmentPending: boolean;
}

export interface UpdateStudentData {
  fullName?: string;
  grade?: string;
  academicYear?: number;
  dateOfBirth?: string | null;
  cpf?: string | null;
  gender?: string | null;
  nationality?: string | null;
}

/**
 * Validate a grade value. Returns the grade if valid, throws if invalid.
 * Null/undefined values are allowed (optional field).
 */
function validateGrade(grade: string | null | undefined): string | null | undefined {
  if (grade === null || grade === undefined) return grade;
  if (!VALID_GRADES.has(grade)) {
    throw createAppError(
      'VALIDATION_ERROR',
      `Série inválida: "${grade}". Valores aceitos: ${GRADE_ORDER.join(', ')}`,
    );
  }
  return grade;
}

/**
 * Build Prisma where clause from StudentFilters.
 * Exported so analytics (exportCsv) can reuse the same filter logic.
 */
export function buildWhereClause(filters: StudentFilters): Prisma.StudentWhereInput {
  const where: Prisma.StudentWhereInput = {};

  if (filters.grade) where.grade = filters.grade;
  if (filters.academicYear) where.academicYear = filters.academicYear;
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = 'ACTIVE';
  }

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { cpf: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.parentName) {
    where.lead = {
      parents: {
        some: {
          fullName: { contains: filters.parentName, mode: 'insensitive' },
        },
      },
    };
  }

  if (filters.enrolledAfter || filters.enrolledBefore) {
    where.enrolledAt = {};
    if (filters.enrolledAfter) {
      (where.enrolledAt as Prisma.DateTimeFilter).gte = new Date(filters.enrolledAfter);
    }
    if (filters.enrolledBefore) {
      (where.enrolledAt as Prisma.DateTimeFilter).lte = new Date(filters.enrolledBefore);
    }
  }

  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    where.dateOfBirth = {};
    const today = new Date();

    if (filters.ageMin !== undefined) {
      const maxBirthDate = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate());
      (where.dateOfBirth as Prisma.DateTimeNullableFilter).lte = maxBirthDate;
    }

    if (filters.ageMax !== undefined) {
      const minBirthDate = new Date(today.getFullYear() - filters.ageMax, today.getMonth(), today.getDate());
      (where.dateOfBirth as Prisma.DateTimeNullableFilter).gte = minBirthDate;
    }
  }

  return where;
}

export function buildOrderBy(filters: StudentFilters): Prisma.StudentOrderByWithRelationInput {
  if (filters.sortBy) {
    return { [filters.sortBy]: filters.sortOrder ?? 'asc' };
  }
  return { createdAt: 'desc' };
}

async function getAlertsForStudents(
  students: Array<{ id: string; leadId: string }>,
): Promise<Map<string, StudentAlerts>> {
  const leadIds = [...new Set(students.map((s) => s.leadId))];
  const studentIds = students.map((s) => s.id);

  const pendingDocsLeads = await prisma.leadEnrollmentDocument.findMany({
    where: {
      leadId: { in: leadIds },
      status: { not: 'APPROVED' },
    },
    select: { leadId: true },
    distinct: ['leadId'],
  });
  const pendingDocsSet = new Set(pendingDocsLeads.map((d) => d.leadId));

  const expiringContractsLeads = await prisma.contract.findMany({
    where: {
      leadId: { in: leadIds },
      status: { in: ['SENT'] },
    },
    select: { leadId: true },
    distinct: ['leadId'],
  });
  const expiringContractsSet = new Set(expiringContractsLeads.map((c) => c.leadId));

  const pendingInvites = await prisma.reEnrollmentInvite.findMany({
    where: {
      studentId: { in: studentIds },
      status: { in: ['PENDING', 'SENT'] },
    },
    select: { studentId: true },
    distinct: ['studentId'],
  });
  const pendingInvitesSet = new Set(pendingInvites.map((i) => i.studentId));

  const alertsMap = new Map<string, StudentAlerts>();
  for (const student of students) {
    alertsMap.set(student.id, {
      pendingDocs: pendingDocsSet.has(student.leadId),
      contractExpiring: expiringContractsSet.has(student.leadId),
      reEnrollmentPending: pendingInvitesSet.has(student.id),
    });
  }

  return alertsMap;
}

/**
 * List students with optional filters and pagination (STU-02 / D-12).
 * Includes alert indicators per student.
 */
export async function findMany(filters: StudentFilters, pagination: PaginationParams) {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters);

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.student.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pagination.limit);

  const alertsMap = await getAlertsForStudents(students);

  const studentsWithAlerts = students.map((s) => ({
    ...s,
    alerts:
      alertsMap.get(s.id) ?? {
        pendingDocs: false,
        contractExpiring: false,
        reEnrollmentPending: false,
      },
  }));

  return {
    students: studentsWithAlerts,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
  };
}

export async function findById(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!student) {
    throw createAppError('STUDENT_NOT_FOUND');
  }

  return student;
}

export async function findByIdWithDocuments(id: string) {
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!student) {
    return null;
  }

  const actorIds = [
    ...new Set(student.history.map((h) => h.actorId).filter(Boolean)),
  ] as string[];
  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, displayName: true },
    });
    for (const u of users) {
      actorMap.set(u.id, u.displayName);
    }
  }
  const enrichedHistory = student.history.map((h) => ({
    ...h,
    actorName: h.actorId ? (actorMap.get(h.actorId) ?? null) : null,
  }));

  const lead = await prisma.lead.findUnique({
    where: { id: student.leadId },
    select: {
      documents: { where: { childId: student.leadChildId } },
      enrollmentDocuments: { where: { childId: student.leadChildId } },
      emergencyContacts: { orderBy: { isPrimary: 'desc' as const } },
      childrenHealth: { where: { childId: student.leadChildId } },
      childrenTransport: { where: { childId: student.leadChildId } },
      enrollmentInfo: { where: { childId: student.leadChildId } },
      healthPlan: true,
      parents: {
        orderBy: { parentType: 'asc' as const },
        select: {
          id: true,
          fullName: true,
          parentType: true,
          phone: true,
          email: true,
        },
      },
    },
  });

  return {
    student: { ...student, history: enrichedHistory },
    documents: lead?.documents ?? [],
    enrollmentDocuments: lead?.enrollmentDocuments ?? [],
    emergencyContacts: lead?.emergencyContacts ?? [],
    healthData: lead?.childrenHealth?.[0] ?? null,
    transportData: lead?.childrenTransport?.[0] ?? null,
    enrollmentInfo: lead?.enrollmentInfo?.[0] ?? null,
    healthPlan: lead?.healthPlan ?? null,
    parents: lead?.parents ?? [],
  };
}

export async function updateStatus(
  id: string,
  newStatus: StudentStatus,
  actorId: string,
  reason?: string,
) {
  const student = await prisma.student.findUnique({ where: { id } });

  if (!student) {
    throw createAppError('STUDENT_NOT_FOUND');
  }

  const previousStatus = student.status;

  const updatedStudent = await withTenantTx(prisma, async (tx) => {
    const updated = await tx.student.update({
      where: { id },
      data: { status: newStatus },
    });
    await tx.studentHistory.create({
      data: {
        studentId: id,
        action: 'STATUS_CHANGED',
        details: { previousStatus, newStatus, reason: reason ?? null },
        actorId,
      },
    });
    return updated;
  });

  try {
    await createAuditLog({
      actorId,
      actorEmail: 'system',
      action: 'STUDENT_STATUS_CHANGED',
      entityType: 'Student',
      entityId: id,
      metadata: { previousStatus, newStatus, reason },
    });
  } catch (err) {
    logger.warn('Audit log failed for student status update', {
      id,
      error: (err as Error).message,
    });
  }

  try {
    await redis.publish(
      'students:list',
      JSON.stringify({ type: 'student:updated', studentId: id }),
    );
  } catch (err) {
    logger.warn('Redis publish failed for student:updated', {
      id,
      error: (err as Error).message,
    });
  }

  try {
    getIO()
      .to('students:list')
      .emit('students:list:updated', { type: 'student:updated', studentId: id });
  } catch (err) {
    logger.warn('Socket emit failed for student:updated', {
      id,
      error: (err as Error).message,
    });
  }

  return updatedStudent;
}

export async function updateStudent(
  id: string,
  data: UpdateStudentData,
  actorId: string,
) {
  if (data.grade !== undefined) {
    validateGrade(data.grade);
  }

  const student = await prisma.student.findUnique({ where: { id } });

  if (!student) {
    throw createAppError('STUDENT_NOT_FOUND');
  }

  const changes: Record<
    string,
    { from: string | number | null; to: string | number | null }
  > = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    const current = (student as unknown as Record<string, string | number | null>)[
      key
    ];
    if (value !== current) {
      changes[key] = { from: current ?? null, to: value ?? null };
    }
  }

  if (Object.keys(changes).length === 0) {
    return student;
  }

  const updateData: Record<string, unknown> = {};
  for (const key of Object.keys(changes)) {
    updateData[key] = changes[key].to;
  }

  const updatedStudent = await withTenantTx(prisma, async (tx) => {
    const updated = await tx.student.update({ where: { id }, data: updateData });
    await tx.studentHistory.create({
      data: {
        studentId: id,
        action: 'DATA_UPDATED',
        details: { changes, fieldCount: Object.keys(changes).length },
        actorId,
      },
    });
    return updated;
  });

  await syncStudentToLeadChild(id, updateData);

  try {
    await createAuditLog({
      actorId,
      actorEmail: 'system',
      action: 'STUDENT_UPDATED',
      entityType: 'Student',
      entityId: id,
      metadata: { changes },
    });
  } catch (err) {
    logger.warn('Audit log failed for student update', {
      id,
      error: (err as Error).message,
    });
  }

  try {
    await redis.publish(
      'students:list',
      JSON.stringify({ type: 'student:updated', studentId: id }),
    );
  } catch (err) {
    logger.warn('Redis publish failed for student:updated', {
      id,
      error: (err as Error).message,
    });
  }

  try {
    getIO()
      .to('students:list')
      .emit('students:list:updated', { type: 'student:updated', studentId: id });
  } catch (err) {
    logger.warn('Socket emit failed for student:updated', {
      id,
      error: (err as Error).message,
    });
  }

  return updatedStudent;
}

export async function bulkUpdate(
  ids: string[],
  action: { type: 'changeGrade' | 'changeStatus'; value: string },
  actorId: string,
) {
  const students = await prisma.student.findMany({
    where: { id: { in: ids } },
    select: { id: true, grade: true, status: true },
  });

  if (students.length !== ids.length) {
    const foundIds = new Set(students.map((s) => s.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    throw createAppError(
      'STUDENT_NOT_FOUND',
      `Alunos não encontrados: ${missing.join(', ')}`,
    );
  }

  const validStatuses: StudentStatus[] = [
    'ACTIVE',
    'INACTIVE',
    'TRANSFERRED',
    'GRADUATED',
    'CANCELLED',
  ];
  if (
    action.type === 'changeStatus' &&
    !validStatuses.includes(action.value as StudentStatus)
  ) {
    throw createAppError('VALIDATION_ERROR', `Status inválido: ${action.value}`);
  }

  const updateData: Prisma.StudentUpdateManyMutationInput =
    action.type === 'changeGrade'
      ? { grade: action.value }
      : { status: action.value as StudentStatus };

  const historyAction =
    action.type === 'changeGrade' ? 'GRADE_CHANGED' : 'STATUS_CHANGED';

  await withTenantTx(prisma, async (tx) => {
    await tx.student.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    const historyEntries = students.map((s) => ({
      studentId: s.id,
      action: historyAction,
      details: {
        bulk: true,
        previousValue: action.type === 'changeGrade' ? s.grade : s.status,
        newValue: action.value,
      } as Prisma.InputJsonValue,
      actorId,
    }));

    await tx.studentHistory.createMany({ data: historyEntries });
  });

  try {
    getIO()
      .to('students:list')
      .emit('students:list:updated', { type: 'bulk:updated', ids });
  } catch (err) {
    logger.warn('Socket emit failed for bulk update', {
      error: (err as Error).message,
    });
  }

  return { updated: ids.length };
}

export async function uploadAvatar(
  studentId: string,
  buffer: Buffer,
  mimeType: string,
  actorId: string,
): Promise<string> {
  const student = await prisma.student.findUnique({ where: { id: studentId } });

  if (!student) {
    throw createAppError('STUDENT_NOT_FOUND');
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[mimeType] ?? 'jpg';

  const path = `avatars/${studentId}.${ext}`;
  const url = await uploadFile(buffer, path, mimeType);

  if (!url) {
    throw createAppError('UPLOAD_FAILED', 'Falha ao enviar foto do aluno.');
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { avatarUrl: url },
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'AVATAR_UPDATED',
      details: { avatarUrl: url },
      actorId,
    },
  });

  return url;
}

// ==================== STUDENT REF HELPERS (used by document-upload route) ====================

/**
 * Returns the createdStudentIds attached to a previous import run.
 * Used by the bulk-document upload endpoint so the controller does not
 * have to reach into Prisma directly.
 */
export async function findStudentIdsFromImport(
  importHistoryId: string,
): Promise<string[] | null> {
  const history = await prisma.importHistory.findUnique({
    where: { id: importHistoryId },
    select: { createdStudentIds: true },
  });
  if (!history?.createdStudentIds) return null;
  return history.createdStudentIds as string[];
}

/**
 * Returns up to 500 student IDs matching a coarse filter set
 * (academic year, grade, status). Defaults to ACTIVE students.
 */
export async function findStudentIdsByImportFilters(filters: {
  academicYear?: number;
  grade?: string;
  status?: StudentStatus;
}): Promise<string[]> {
  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (filters.academicYear) where.academicYear = filters.academicYear;
  if (filters.grade) where.grade = filters.grade;
  if (filters.status) where.status = filters.status;

  const filtered = await prisma.student.findMany({
    where,
    select: { id: true },
    take: 500,
  });
  return filtered.map((s) => s.id);
}

export async function findStudentRefsByIds(ids: string[]) {
  return prisma.student.findMany({
    where: { id: { in: ids } },
    select: { id: true, fullName: true, leadId: true, leadChildId: true },
  });
}
