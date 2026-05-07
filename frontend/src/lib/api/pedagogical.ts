import { api } from '@/lib/api';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface SchoolSubject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: string;
  year: number;
  shift: string | null;
  capacity: number | null;
  homeroomTeacherId: string | null;
  isActive: boolean;
  homeroomTeacher: { id: string; displayName: string; avatarUrl: string | null } | null;
  _count: { enrollments: number; classSubjects: number; lessonPlans: number };
}

export interface SchoolClassDetail extends Omit<SchoolClass, '_count'> {
  enrollments: Array<{
    id: string;
    studentId: string;
    enrolledAt: string;
    student: { id: string; fullName: string; code: string; avatarUrl: string | null };
  }>;
  classSubjects: Array<{
    id: string;
    subjectId: string;
    teacherId: string | null;
    weeklyHours: number | null;
    subject: { id: string; name: string; code: string | null };
    teacher: { id: string; displayName: string; avatarUrl: string | null } | null;
  }>;
}

export interface LessonPlan {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  objectives: string | null;
  content: string | null;
  scheduledDate: string | null;
  completedAt: string | null;
  createdAt: string;
  class: { id: string; name: string; year: number };
  subject: { id: string; name: string; code: string | null };
  teacher: { id: string; displayName: string; avatarUrl: string | null };
}

export interface StudentGrade {
  id: string;
  classId: string;
  studentId: string;
  subjectId: string;
  period: string;
  grade: number;
  weight: number;
  type: string | null;
  notes: string | null;
  recordedAt: string;
  student: { id: string; fullName: string; code: string };
  subject: { id: string; name: string };
  class: { id: string; name: string; year: number };
}

export interface AttendanceRow {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  recordedAt: string;
  student: { id: string; fullName: string; code: string };
}

export const pedagogicalApi = {
  // Subjects
  listSubjects: () =>
    api.get<{ success: true; data: SchoolSubject[] }>('/pedagogical/subjects').then((r) => r.data.data),
  createSubject: (body: { name: string; code?: string; description?: string }) =>
    api.post<{ success: true; data: SchoolSubject }>('/pedagogical/subjects', body).then((r) => r.data.data),
  updateSubject: (id: string, body: Partial<{ name: string; code: string | null; description: string | null; isActive: boolean }>) =>
    api.patch<{ success: true; data: SchoolSubject }>(`/pedagogical/subjects/${id}`, body).then((r) => r.data.data),
  deleteSubject: (id: string) =>
    api.delete<{ success: true }>(`/pedagogical/subjects/${id}`).then((r) => r.data),

  // Classes
  listClasses: (year?: number) =>
    api.get<{ success: true; data: SchoolClass[] }>('/pedagogical/classes', { params: year ? { year } : undefined }).then((r) => r.data.data),
  getClass: (id: string) =>
    api.get<{ success: true; data: SchoolClassDetail }>(`/pedagogical/classes/${id}`).then((r) => r.data.data),
  createClass: (body: { name: string; grade: string; year: number; shift?: string; capacity?: number; homeroomTeacherId?: string | null }) =>
    api.post<{ success: true; data: SchoolClass }>('/pedagogical/classes', body).then((r) => r.data.data),
  updateClass: (id: string, body: any) =>
    api.patch<{ success: true; data: SchoolClass }>(`/pedagogical/classes/${id}`, body).then((r) => r.data.data),
  deleteClass: (id: string) =>
    api.delete<{ success: true }>(`/pedagogical/classes/${id}`).then((r) => r.data),
  addClassSubject: (classId: string, body: { subjectId: string; teacherId?: string; weeklyHours?: number }) =>
    api.post<{ success: true; data: any }>(`/pedagogical/classes/${classId}/subjects`, body).then((r) => r.data.data),
  removeClassSubject: (classId: string, classSubjectId: string) =>
    api.delete<{ success: true }>(`/pedagogical/classes/${classId}/subjects/${classSubjectId}`).then((r) => r.data),
  enrollStudent: (classId: string, studentId: string) =>
    api.post<{ success: true; data: any }>(`/pedagogical/classes/${classId}/enrollments`, { studentId }).then((r) => r.data.data),
  unenrollStudent: (classId: string, studentId: string) =>
    api.delete<{ success: true }>(`/pedagogical/classes/${classId}/enrollments/${studentId}`).then((r) => r.data),

  // Lesson plans
  listLessonPlans: (filters: { classId?: string; subjectId?: string; teacherId?: string } = {}) =>
    api.get<{ success: true; data: LessonPlan[] }>('/pedagogical/lesson-plans', { params: filters }).then((r) => r.data.data),
  createLessonPlan: (body: { classId: string; subjectId: string; teacherId: string; title: string; objectives?: string; content?: string; scheduledDate?: string | null }) =>
    api.post<{ success: true; data: LessonPlan }>('/pedagogical/lesson-plans', body).then((r) => r.data.data),
  updateLessonPlan: (id: string, body: any) =>
    api.patch<{ success: true; data: LessonPlan }>(`/pedagogical/lesson-plans/${id}`, body).then((r) => r.data.data),
  deleteLessonPlan: (id: string) =>
    api.delete<{ success: true }>(`/pedagogical/lesson-plans/${id}`).then((r) => r.data),

  // Grades
  listGrades: (filters: { classId?: string; studentId?: string; subjectId?: string; period?: string } = {}) =>
    api.get<{ success: true; data: StudentGrade[] }>('/pedagogical/grades', { params: filters }).then((r) => r.data.data),
  createGrade: (body: { classId: string; studentId: string; subjectId: string; period: string; grade: number; weight?: number; type?: string; notes?: string }) =>
    api.post<{ success: true; data: StudentGrade }>('/pedagogical/grades', body).then((r) => r.data.data),
  updateGrade: (id: string, body: any) =>
    api.patch<{ success: true; data: StudentGrade }>(`/pedagogical/grades/${id}`, body).then((r) => r.data.data),
  deleteGrade: (id: string) =>
    api.delete<{ success: true }>(`/pedagogical/grades/${id}`).then((r) => r.data),

  // Attendance
  listAttendance: (filters: { classId: string; date?: string }) =>
    api.get<{ success: true; data: AttendanceRow[] }>('/pedagogical/attendance', { params: filters }).then((r) => r.data.data),
  bulkRecordAttendance: (body: { classId: string; date: string; records: Array<{ studentId: string; status: AttendanceStatus; notes?: string }> }) =>
    api.post<{ success: true; data: any }>('/pedagogical/attendance/bulk', body).then((r) => r.data),
};

export const attendanceLabel: Record<AttendanceStatus, string> = {
  PRESENT: 'Presente',
  ABSENT:  'Falta',
  LATE:    'Atraso',
  EXCUSED: 'Justificada',
};
