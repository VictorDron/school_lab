import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as PedagogicalService from '../services/pedagogical.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { AttendanceStatus } from '@prisma/client';

// ==================== SUBJECTS ====================

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().max(16).optional(),
  description: z.string().optional(),
});

export async function listSubjects(_req: AuthenticatedRequest, res: Response) {
  res.json({ success: true, data: await PedagogicalService.listSubjects() });
}

export async function createSubject(req: AuthenticatedRequest, res: Response) {
  const data = subjectSchema.parse(req.body);
  const subject = await PedagogicalService.createSubject(data);
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_SUBJECT_CREATED', entityType: 'SUBJECT', entityId: subject.id, metadata: { name: subject.name } }, req);
  res.status(201).json({ success: true, data: subject });
}

export async function updateSubject(req: AuthenticatedRequest, res: Response) {
  const data = subjectSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
  const subject = await PedagogicalService.updateSubject(req.params.id, data);
  if (!subject) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_SUBJECT_UPDATED', entityType: 'SUBJECT', entityId: subject.id, metadata: data }, req);
  res.json({ success: true, data: subject });
}

export async function deleteSubject(req: AuthenticatedRequest, res: Response) {
  const subject = await PedagogicalService.deleteSubject(req.params.id);
  if (!subject) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_SUBJECT_DELETED', entityType: 'SUBJECT', entityId: subject.id }, req);
  res.json({ success: true });
}

// ==================== CLASSES ====================

const classSchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  shift: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  homeroomTeacherId: z.string().uuid().optional().nullable(),
});

export async function listClasses(req: AuthenticatedRequest, res: Response) {
  const year = req.query.year ? Number(req.query.year) : undefined;
  res.json({ success: true, data: await PedagogicalService.listClasses({ year }) });
}

export async function getClass(req: AuthenticatedRequest, res: Response) {
  const data = await PedagogicalService.getClass(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  res.json({ success: true, data });
}

export async function createClass(req: AuthenticatedRequest, res: Response) {
  const data = classSchema.parse(req.body);
  const cls = await PedagogicalService.createClass({
    name: data.name,
    grade: data.grade,
    year: data.year,
    shift: data.shift,
    capacity: data.capacity,
    homeroomTeacherId: data.homeroomTeacherId ?? undefined,
  });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_CLASS_CREATED', entityType: 'SCHOOL_CLASS', entityId: cls.id, metadata: { name: cls.name } }, req);
  res.status(201).json({ success: true, data: cls });
}

export async function updateClass(req: AuthenticatedRequest, res: Response) {
  const data = classSchema.partial().extend({ isActive: z.boolean().optional() }).parse(req.body);
  const cls = await PedagogicalService.updateClass(req.params.id, data);
  if (!cls) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_CLASS_UPDATED', entityType: 'SCHOOL_CLASS', entityId: cls.id, metadata: data }, req);
  res.json({ success: true, data: cls });
}

export async function deleteClass(req: AuthenticatedRequest, res: Response) {
  const cls = await PedagogicalService.deleteClass(req.params.id);
  if (!cls) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'SCHOOL_CLASS_DELETED', entityType: 'SCHOOL_CLASS', entityId: cls.id }, req);
  res.json({ success: true });
}

// ==================== CLASS SUBJECTS ====================

const classSubjectSchema = z.object({
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
  weeklyHours: z.number().int().positive().optional(),
});

export async function addClassSubject(req: AuthenticatedRequest, res: Response) {
  const data = classSubjectSchema.parse(req.body);
  const cs = await PedagogicalService.addClassSubject(req.params.id, data);
  if (!cs) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'CLASS_SUBJECT_ADDED', entityType: 'CLASS_SUBJECT', entityId: cs.id, metadata: { classId: req.params.id, subjectId: data.subjectId } }, req);
  res.status(201).json({ success: true, data: cs });
}

export async function removeClassSubject(req: AuthenticatedRequest, res: Response) {
  const cs = await PedagogicalService.removeClassSubject(req.params.classSubjectId);
  if (!cs) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'CLASS_SUBJECT_REMOVED', entityType: 'CLASS_SUBJECT', entityId: cs.id }, req);
  res.json({ success: true });
}

// ==================== ENROLLMENTS ====================

const enrollSchema = z.object({ studentId: z.string().uuid() });

export async function enrollStudent(req: AuthenticatedRequest, res: Response) {
  const { studentId } = enrollSchema.parse(req.body);
  const en = await PedagogicalService.enrollStudent(req.params.id, studentId);
  if (!en) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'STUDENT_ENROLLED_CLASS', entityType: 'CLASS_ENROLLMENT', entityId: en.id, metadata: { classId: req.params.id, studentId } }, req);
  res.status(201).json({ success: true, data: en });
}

export async function unenrollStudent(req: AuthenticatedRequest, res: Response) {
  const en = await PedagogicalService.unenrollStudent(req.params.id, req.params.studentId);
  if (!en) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'STUDENT_UNENROLLED_CLASS', entityType: 'CLASS_ENROLLMENT', entityId: en.id, metadata: { classId: req.params.id, studentId: req.params.studentId } }, req);
  res.json({ success: true });
}

// ==================== LESSON PLANS ====================

const lessonPlanSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  title: z.string().min(1),
  objectives: z.string().optional(),
  content: z.string().optional(),
  scheduledDate: z.string().datetime().optional().nullable(),
});

export async function listLessonPlans(req: AuthenticatedRequest, res: Response) {
  const filters = {
    classId: req.query.classId as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
    teacherId: req.query.teacherId as string | undefined,
  };
  res.json({ success: true, data: await PedagogicalService.listLessonPlans(filters) });
}

export async function createLessonPlan(req: AuthenticatedRequest, res: Response) {
  const data = lessonPlanSchema.parse(req.body);
  const plan = await PedagogicalService.createLessonPlan({
    ...data,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
  });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'LESSON_PLAN_CREATED', entityType: 'LESSON_PLAN', entityId: plan.id, metadata: { title: plan.title } }, req);
  res.status(201).json({ success: true, data: plan });
}

export async function updateLessonPlan(req: AuthenticatedRequest, res: Response) {
  const data = z.object({
    title: z.string().min(1).optional(),
    objectives: z.string().nullish(),
    content: z.string().nullish(),
    scheduledDate: z.string().datetime().nullish(),
    completedAt: z.string().datetime().nullish(),
  }).parse(req.body);
  const plan = await PedagogicalService.updateLessonPlan(req.params.id, {
    title: data.title,
    objectives: data.objectives ?? null,
    content: data.content ?? null,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : data.scheduledDate as null | undefined,
    completedAt: data.completedAt ? new Date(data.completedAt) : data.completedAt as null | undefined,
  });
  if (!plan) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'LESSON_PLAN_UPDATED', entityType: 'LESSON_PLAN', entityId: plan.id }, req);
  res.json({ success: true, data: plan });
}

export async function deleteLessonPlan(req: AuthenticatedRequest, res: Response) {
  const plan = await PedagogicalService.deleteLessonPlan(req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'LESSON_PLAN_DELETED', entityType: 'LESSON_PLAN', entityId: plan.id }, req);
  res.json({ success: true });
}

// ==================== GRADES ====================

const gradeSchema = z.object({
  classId: z.string().uuid(),
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  period: z.string().min(1),
  grade: z.number(),
  weight: z.number().positive().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
});

export async function listGrades(req: AuthenticatedRequest, res: Response) {
  const filters = {
    classId:   req.query.classId as string | undefined,
    studentId: req.query.studentId as string | undefined,
    subjectId: req.query.subjectId as string | undefined,
    period:    req.query.period as string | undefined,
  };
  res.json({ success: true, data: await PedagogicalService.listGrades(filters) });
}

export async function createGrade(req: AuthenticatedRequest, res: Response) {
  const data = gradeSchema.parse(req.body);
  const g = await PedagogicalService.createGrade(data, req.user!.id);
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'STUDENT_GRADE_RECORDED', entityType: 'GRADE', entityId: g.id, metadata: { grade: g.grade, period: g.period } }, req);
  res.status(201).json({ success: true, data: g });
}

export async function updateGrade(req: AuthenticatedRequest, res: Response) {
  const data = gradeSchema.partial().pick({ grade: true, weight: true, type: true, notes: true, period: true }).parse(req.body);
  const g = await PedagogicalService.updateGrade(req.params.id, {
    ...data,
    type: data.type ?? null,
    notes: data.notes ?? null,
  });
  if (!g) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'STUDENT_GRADE_UPDATED', entityType: 'GRADE', entityId: g.id }, req);
  res.json({ success: true, data: g });
}

export async function deleteGrade(req: AuthenticatedRequest, res: Response) {
  const g = await PedagogicalService.deleteGrade(req.params.id);
  if (!g) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'STUDENT_GRADE_DELETED', entityType: 'GRADE', entityId: g.id }, req);
  res.json({ success: true });
}

// ==================== ATTENDANCE ====================

const bulkAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    notes: z.string().optional(),
  })).min(1),
});

export async function listAttendance(req: AuthenticatedRequest, res: Response) {
  const classId = req.query.classId as string;
  const date = req.query.date as string | undefined;
  if (!classId) return res.status(400).json({ success: false, error: 'classId required' });
  res.json({ success: true, data: await PedagogicalService.listAttendance({ classId, date }) });
}

export async function bulkRecordAttendance(req: AuthenticatedRequest, res: Response) {
  const data = bulkAttendanceSchema.parse(req.body);
  const result = await PedagogicalService.bulkRecordAttendance(
    data.classId,
    data.date,
    data.records.map((r) => ({ studentId: r.studentId, status: r.status as AttendanceStatus, notes: r.notes })),
    req.user!.id,
  );
  if (!result) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog({ actorId: req.user!.id, actorEmail: req.user!.email, action: 'ATTENDANCE_RECORDED', entityType: 'ATTENDANCE', metadata: { classId: data.classId, date: data.date, count: data.records.length } }, req);
  res.json({ success: true, data: result });
}
