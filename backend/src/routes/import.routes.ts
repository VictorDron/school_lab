import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as ImportController from '../controllers/import.controller.js';

const router = Router();

const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for CSV/XLSX
});

const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for ZIP
});

// All import routes require authentication and STUDENT_MANAGEMENT access
router.use(authenticate);
router.use(requireModuleAccess('STUDENT_MANAGEMENT', 'VIEW'));

// Template download (GET, VIEW access is sufficient)
router.get('/template', ImportController.downloadTemplate);

// Import history (GET, VIEW access)
router.get('/history', ImportController.getHistory);
router.get('/history/:id', ImportController.getHistoryById);

// Preview (POST, EDIT access required)
router.post('/preview', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), uploadFile.single('file'), ImportController.preview);

// Confirm import (POST, EDIT access)
router.post('/confirm', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), ImportController.confirm);

// Document upload (POST, EDIT access)
router.post('/documents', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), uploadZip.single('file'), ImportController.uploadDocuments);

export default router;
