import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as StudentsController from '../controllers/students.controller.js';

const router = Router();

// Multer setup for avatar upload: memory storage, 2MB limit, image types only
const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de arquivo inválido. Envie uma imagem JPEG, PNG ou WebP.'));
    }
  },
});

// Multer setup for single document upload: memory storage, 10MB limit
const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Multer setup for ZIP document upload: memory storage, 50MB limit
const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Per D-10: all student routes require STUDENT_MANAGEMENT module access
router.use(authenticate);
router.use(requireModuleAccess('STUDENT_MANAGEMENT', 'VIEW'));

// Static paths first (before parameterized :id routes)
router.get('/integrity/audit', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.integrityAudit);
router.post('/integrity/repair', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.integrityRepair);
router.get('/stats/dashboard', StudentsController.getDashboardStats);
router.get('/stats/evolution', StudentsController.getEvolutionStats);
router.get('/export', StudentsController.exportCsv);
router.get('/', StudentsController.list);
router.patch('/bulk', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.bulkUpdate);
router.post('/documents/upload', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), uploadZip.single('file'), StudentsController.uploadDocuments);
router.post('/:id/avatar', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), uploadMiddleware.single('avatar'), StudentsController.uploadAvatar);
router.post('/:id/documents', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), uploadDocument.single('file'), StudentsController.uploadStudentDocument);
router.patch('/:id/documents/:docId/review', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.reviewStudentDocument);
router.patch('/:id/documents/:docId/type', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateStudentDocumentType);
router.delete('/:id/documents/:docId', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.deleteStudentDocument);
router.patch('/:id/health', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateHealth);
router.patch('/:id/transport', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateTransport);
router.patch('/:id/enrollment-info', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateEnrollmentInfo);
router.patch('/:id/health-plan', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateHealthPlan);
router.patch('/:id/emergency-contacts/:contactId', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateEmergencyContact);
router.patch('/:id/parents/:parentId', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateParent);
router.get('/:id', StudentsController.getById);
router.patch('/:id/status', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.updateStatus);
router.patch('/:id', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), StudentsController.update);

export default router;
