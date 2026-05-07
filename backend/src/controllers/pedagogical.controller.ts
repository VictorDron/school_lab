import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

const NOT_IMPLEMENTED = (res: Response) =>
  res.status(501).json({ success: false, error: 'NOT_IMPLEMENTED', message: 'Endpoint scaffolded — implementation pending.' });

// Subjects
export async function listSubjects(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createSubject(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateSubject(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteSubject(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Classes
export async function listClasses(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function getClass(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createClass(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateClass(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteClass(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function addClassSubject(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function removeClassSubject(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function enrollStudent(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function unenrollStudent(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Lesson plans
export async function listLessonPlans(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createLessonPlan(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateLessonPlan(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteLessonPlan(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Grades
export async function listGrades(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createGrade(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateGrade(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteGrade(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// Attendance
export async function listAttendance(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function bulkRecordAttendance(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
