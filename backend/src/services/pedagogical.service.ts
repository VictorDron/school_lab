import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { AttendanceStatus } from '@prisma/client';

// ==================== SUBJECTS ====================

export async function listSubjects() {
  const tenantId = requireTenantId();
  return prisma.schoolSubject.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function createSubject(data: { name: string; code?: string; description?: string }) {
  const tenantId = requireTenantId();
  return prisma.schoolSubject.create({
    data: {
      tenantId,
      name: data.name.trim(),
      code: data.code?.trim().toUpperCase() || null,
      description: data.description?.trim() || null,
    },
  });
}

export async function updateSubject(id: string, data: { name?: string; code?: string | null; description?: string | null; isActive?: boolean }) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolSubject.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.schoolSubject.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.code !== undefined && { code: data.code?.trim().toUpperCase() || null }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
}

export async function deleteSubject(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolSubject.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.schoolSubject.delete({ where: { id } });
  return existing;
}

// ==================== CLASSES ====================

const classInclude = {
  homeroomTeacher: { select: { id: true, displayName: true, avatarUrl: true } },
  _count: { select: { enrollments: true, classSubjects: true, lessonPlans: true } },
} as const;

const classDetailInclude = {
  homeroomTeacher: { select: { id: true, displayName: true, avatarUrl: true } },
  enrollments: {
    include: { student: { select: { id: true, fullName: true, code: true, avatarUrl: true } } },
    orderBy: { student: { fullName: 'asc' } },
  },
  classSubjects: {
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, displayName: true, avatarUrl: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  },
} as const;

export async function listClasses(filters: { year?: number } = {}) {
  const tenantId = requireTenantId();
  return prisma.schoolClass.findMany({
    where: {
      tenantId,
      ...(filters.year !== undefined && { year: filters.year }),
    },
    include: classInclude,
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
  });
}

export async function getClass(id: string) {
  const tenantId = requireTenantId();
  return prisma.schoolClass.findFirst({
    where: { id, tenantId },
    include: classDetailInclude as any,
  });
}

export async function createClass(data: { name: string; grade: string; year: number; shift?: string; capacity?: number; homeroomTeacherId?: string }) {
  const tenantId = requireTenantId();
  return prisma.schoolClass.create({
    data: {
      tenantId,
      name: data.name.trim(),
      grade: data.grade.trim(),
      year: data.year,
      shift: data.shift?.trim() || null,
      capacity: data.capacity ?? null,
      homeroomTeacherId: data.homeroomTeacherId || null,
    },
    include: classInclude,
  });
}

export async function updateClass(id: string, data: { name?: string; grade?: string; year?: number; shift?: string | null; capacity?: number | null; homeroomTeacherId?: string | null; isActive?: boolean }) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolClass.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.schoolClass.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.grade !== undefined && { grade: data.grade.trim() }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.shift !== undefined && { shift: data.shift?.trim() || null }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.homeroomTeacherId !== undefined && { homeroomTeacherId: data.homeroomTeacherId || null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: classInclude,
  });
}

export async function deleteClass(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.schoolClass.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.schoolClass.delete({ where: { id } });
  return existing;
}

// ==================== CLASS SUBJECTS ====================

export async function addClassSubject(classId: string, data: { subjectId: string; teacherId?: string; weeklyHours?: number }) {
  const tenantId = requireTenantId();
  const cls = await prisma.schoolClass.findFirst({ where: { id: classId, tenantId } });
  if (!cls) return null;
  return prisma.classSubject.create({
    data: {
      tenantId,
      classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId || null,
      weeklyHours: data.weeklyHours ?? null,
    },
    include: {
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, displayName: true } },
    },
  });
}

export async function removeClassSubject(classSubjectId: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.classSubject.findFirst({ where: { id: classSubjectId, tenantId } });
  if (!existing) return null;
  await prisma.classSubject.delete({ where: { id: classSubjectId } });
  return existing;
}

// ==================== ENROLLMENTS ====================

export async function enrollStudent(classId: string, studentId: string) {
  const tenantId = requireTenantId();
  const [cls, student] = await Promise.all([
    prisma.schoolClass.findFirst({ where: { id: classId, tenantId } }),
    prisma.student.findFirst({ where: { id: studentId, tenantId } }),
  ]);
  if (!cls || !student) return null;
  return prisma.classEnrollment.create({
    data: { tenantId, classId, studentId },
    include: { student: { select: { id: true, fullName: true, code: true } } },
  });
}

export async function unenrollStudent(classId: string, studentId: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.classEnrollment.findFirst({
    where: { tenantId, classId, studentId },
  });
  if (!existing) return null;
  await prisma.classEnrollment.delete({ where: { id: existing.id } });
  return existing;
}

// ==================== LESSON PLANS ====================

const lessonPlanInclude = {
  class:   { select: { id: true, name: true, year: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, displayName: true, avatarUrl: true } },
} as const;

export async function listLessonPlans(filters: { classId?: string; subjectId?: string; teacherId?: string } = {}) {
  const tenantId = requireTenantId();
  return prisma.lessonPlan.findMany({
    where: {
      tenantId,
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.teacherId && { teacherId: filters.teacherId }),
    },
    include: lessonPlanInclude,
    orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createLessonPlan(data: { classId: string; subjectId: string; teacherId: string; title: string; objectives?: string; content?: string; scheduledDate?: Date }) {
  const tenantId = requireTenantId();
  return prisma.lessonPlan.create({
    data: {
      tenantId,
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      title: data.title.trim(),
      objectives: data.objectives?.trim() || null,
      content: data.content?.trim() || null,
      scheduledDate: data.scheduledDate ?? null,
    },
    include: lessonPlanInclude,
  });
}

export async function updateLessonPlan(id: string, data: Partial<{ title: string; objectives: string | null; content: string | null; scheduledDate: Date | null; completedAt: Date | null }>) {
  const tenantId = requireTenantId();
  const existing = await prisma.lessonPlan.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.lessonPlan.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.objectives !== undefined && { objectives: data.objectives?.trim() || null }),
      ...(data.content !== undefined && { content: data.content?.trim() || null }),
      ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate }),
      ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
    },
    include: lessonPlanInclude,
  });
}

export async function deleteLessonPlan(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.lessonPlan.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.lessonPlan.delete({ where: { id } });
  return existing;
}

// ==================== GRADES ====================

const gradeInclude = {
  student: { select: { id: true, fullName: true, code: true } },
  subject: { select: { id: true, name: true } },
  class:   { select: { id: true, name: true, year: true } },
} as const;

export async function listGrades(filters: { classId?: string; studentId?: string; subjectId?: string; period?: string } = {}) {
  const tenantId = requireTenantId();
  return prisma.studentGrade.findMany({
    where: {
      tenantId,
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.period && { period: filters.period }),
    },
    include: gradeInclude,
    orderBy: [{ recordedAt: 'desc' }],
  });
}

export async function createGrade(data: { classId: string; studentId: string; subjectId: string; period: string; grade: number; weight?: number; type?: string; notes?: string }, recordedById: string) {
  const tenantId = requireTenantId();
  return prisma.studentGrade.create({
    data: {
      tenantId,
      classId: data.classId,
      studentId: data.studentId,
      subjectId: data.subjectId,
      period: data.period.trim(),
      grade: data.grade,
      weight: data.weight ?? 1.0,
      type: data.type?.trim() || null,
      notes: data.notes?.trim() || null,
      recordedById,
    },
    include: gradeInclude,
  });
}

export async function updateGrade(id: string, data: Partial<{ grade: number; weight: number; type: string | null; notes: string | null; period: string }>) {
  const tenantId = requireTenantId();
  const existing = await prisma.studentGrade.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  return prisma.studentGrade.update({
    where: { id },
    data: {
      ...(data.grade !== undefined && { grade: data.grade }),
      ...(data.weight !== undefined && { weight: data.weight }),
      ...(data.type !== undefined && { type: data.type?.trim() || null }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      ...(data.period !== undefined && { period: data.period.trim() }),
    },
    include: gradeInclude,
  });
}

export async function deleteGrade(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.studentGrade.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.studentGrade.delete({ where: { id } });
  return existing;
}

// ==================== ATTENDANCE ====================

export async function listAttendance(filters: { classId: string; date?: string }) {
  const tenantId = requireTenantId();
  const where: any = { tenantId, classId: filters.classId };
  if (filters.date) where.date = new Date(filters.date);
  return prisma.attendance.findMany({
    where,
    include: { student: { select: { id: true, fullName: true, code: true } } },
    orderBy: [{ date: 'desc' }, { student: { fullName: 'asc' } }],
  });
}

/// Bulk-records attendance for a class+date in a single transaction. Idempotent
/// — re-running for the same date overwrites existing rows.
export async function bulkRecordAttendance(
  classId: string,
  date: string,
  records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
  recordedById: string,
) {
  const tenantId = requireTenantId();
  const cls = await prisma.schoolClass.findFirst({ where: { id: classId, tenantId } });
  if (!cls) return null;

  const dateObj = new Date(date);
  return prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { classId_studentId_date: { classId, studentId: r.studentId, date: dateObj } },
        create: {
          tenantId,
          classId,
          studentId: r.studentId,
          date: dateObj,
          status: r.status,
          notes: r.notes?.trim() || null,
          recordedById,
        },
        update: {
          status: r.status,
          notes: r.notes?.trim() || null,
          recordedById,
          recordedAt: new Date(),
        },
      }),
    ),
  );
}
