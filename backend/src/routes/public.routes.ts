import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as PublicController from '../controllers/public.controller.js';
import { upload } from '../middlewares/upload.js';

// Re-export schemas for backward compatibility (barrel pattern)
export { publicEnrollmentSchema } from '../schemas/public.schemas.js';
export { validateMagicBytes } from '../middlewares/upload.js';

const router = Router();

// ==================== Rate Limiters ====================

const formSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25,
  message: { success: false, error: 'Muitas submissões de formulário. Tente novamente em 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: { success: false, error: 'Muitos uploads. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const formAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== Admission Routes ====================

router.post('/admissions', formSubmitLimiter, PublicController.submitAdmission);
router.get('/application/:token', PublicController.getApplication);
router.post('/application/:token/documents', uploadLimiter, upload.array('files', 10), PublicController.uploadApplicationDocuments);
router.get('/application/:token/documents', PublicController.getApplicationDocuments);
router.delete('/application/:token/documents/:documentId', PublicController.deleteApplicationDocument);

// ==================== Form Draft Routes ====================

router.put('/form-draft/:token', PublicController.saveFormDraft);
router.get('/form-draft/:token', PublicController.getFormDraft);

// ==================== Enrollment Routes ====================

router.get('/enrollment/:token', PublicController.getEnrollmentData);
router.post('/enrollment', formSubmitLimiter, PublicController.submitEnrollment);
router.post('/enrollment/:token/documents', uploadLimiter, upload.array('files', 10), PublicController.uploadEnrollmentDocuments);
router.delete('/enrollment/:token/documents/:documentId', PublicController.deleteEnrollmentDocument);
router.patch('/enrollment/:token/documents/:documentId/includes', PublicController.toggleEnrollmentDocumentIncludes);

// ==================== Webhooks ====================

router.post('/webhooks/clicksign', PublicController.handleClickSignWebhook);

// ==================== Re-Enrollment (Public) ====================

router.get('/re-enrollment/:token', formAccessLimiter, PublicController.getReEnrollmentForm);
router.post('/re-enrollment/:token', formSubmitLimiter, PublicController.submitReEnrollmentForm);
router.post('/re-enrollment/:token/documents', uploadLimiter, upload.array('files', 10), PublicController.uploadReEnrollmentDocuments);

// ==================== Pre-Re-Enrollment (Public) ====================

router.get('/pre-reenrollment/:token', formAccessLimiter, PublicController.getPreReEnrollmentData);
router.post('/pre-reenrollment/:token/respond', formSubmitLimiter, PublicController.submitPreReEnrollmentResponse);

export default router;
