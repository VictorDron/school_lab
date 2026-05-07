import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as PedagogicalController from '../controllers/pedagogical.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('PEDAGOGICAL', 'VIEW'));

// ==================== SUBJECTS (disciplinas) ====================
router.get('/subjects', PedagogicalController.listSubjects as any);
router.post('/subjects', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.createSubject as any);
router.patch('/subjects/:id', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.updateSubject as any);
router.delete('/subjects/:id', requireModuleAccess('PEDAGOGICAL', 'ADMIN'), PedagogicalController.deleteSubject as any);

// ==================== CLASSES (turmas) ====================
router.get('/classes', PedagogicalController.listClasses as any);
router.get('/classes/:id', PedagogicalController.getClass as any);
router.post('/classes', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.createClass as any);
router.patch('/classes/:id', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.updateClass as any);
router.delete('/classes/:id', requireModuleAccess('PEDAGOGICAL', 'ADMIN'), PedagogicalController.deleteClass as any);

// Class subjects
router.post('/classes/:id/subjects', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.addClassSubject as any);
router.delete('/classes/:id/subjects/:classSubjectId', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.removeClassSubject as any);

// Class enrollments (alunos na turma)
router.post('/classes/:id/enrollments', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.enrollStudent as any);
router.delete('/classes/:id/enrollments/:studentId', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.unenrollStudent as any);

// ==================== LESSON PLANS (plano de aulas) ====================
router.get('/lesson-plans', PedagogicalController.listLessonPlans as any);
router.post('/lesson-plans', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.createLessonPlan as any);
router.patch('/lesson-plans/:id', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.updateLessonPlan as any);
router.delete('/lesson-plans/:id', requireModuleAccess('PEDAGOGICAL', 'ADMIN'), PedagogicalController.deleteLessonPlan as any);

// ==================== GRADES (notas) ====================
router.get('/grades', PedagogicalController.listGrades as any);
router.post('/grades', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.createGrade as any);
router.patch('/grades/:id', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.updateGrade as any);
router.delete('/grades/:id', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.deleteGrade as any);

// ==================== ATTENDANCE (frequência) ====================
router.get('/attendance', PedagogicalController.listAttendance as any);
router.post('/attendance/bulk', requireModuleAccess('PEDAGOGICAL', 'EDIT'), PedagogicalController.bulkRecordAttendance as any);

export default router;
