import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as PublicController from '../controllers/public.controller.js';
import { upload } from '../middlewares/upload.js';
import {
  withTenantFromToken,
  applicationTokenResolver,
  enrollmentTokenResolver,
  reEnrollmentInviteTokenResolver,
  preReEnrollmentTokenResolver,
} from '../middlewares/public-tenant.js';

// Re-export schemas for backward compatibility (barrel pattern)
export { publicEnrollmentSchema } from '../schemas/public.schemas.js';
export { validateMagicBytes } from '../middlewares/upload.js';

// Phase 3a: public endpoints have no JWT, so the auth middleware never
// runs and ALS context is empty. These pre-handlers resolve tenantId
// from the token and wrap the rest of the request in runWithTenant.
// New-submission POSTs (no existing entity) use the 'fallback' option
// to land on the default tenant — Phase 3b will replace that with
// subdomain-based routing.
const requireApplicationTenant = withTenantFromToken(applicationTokenResolver, { onMissing: 'reject' });
const fallbackApplicationTenant = withTenantFromToken(applicationTokenResolver, { onMissing: 'fallback' });
const requireEnrollmentTenant = withTenantFromToken(enrollmentTokenResolver, { onMissing: 'reject' });
const fallbackEnrollmentTenant = withTenantFromToken(enrollmentTokenResolver, { onMissing: 'fallback' });
const requireReEnrollmentTenant = withTenantFromToken(reEnrollmentInviteTokenResolver, { onMissing: 'reject' });
const requirePreReEnrollmentTenant = withTenantFromToken(preReEnrollmentTokenResolver, { onMissing: 'reject' });

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

router.post('/admissions', formSubmitLimiter, fallbackApplicationTenant, PublicController.submitAdmission);
router.get('/application/:token', requireApplicationTenant, PublicController.getApplication);
router.post('/application/:token/documents', uploadLimiter, upload.array('files', 10), requireApplicationTenant, PublicController.uploadApplicationDocuments);
router.get('/application/:token/documents', requireApplicationTenant, PublicController.getApplicationDocuments);
router.delete('/application/:token/documents/:documentId', requireApplicationTenant, PublicController.deleteApplicationDocument);

// ==================== Form Draft Routes ====================

router.put('/form-draft/:token', PublicController.saveFormDraft);
router.get('/form-draft/:token', PublicController.getFormDraft);

// ==================== Enrollment Routes ====================

router.get('/enrollment/:token', requireEnrollmentTenant, PublicController.getEnrollmentData);
router.post('/enrollment', formSubmitLimiter, fallbackEnrollmentTenant, PublicController.submitEnrollment);
router.post('/enrollment/:token/documents', uploadLimiter, upload.array('files', 10), requireEnrollmentTenant, PublicController.uploadEnrollmentDocuments);
router.delete('/enrollment/:token/documents/:documentId', requireEnrollmentTenant, PublicController.deleteEnrollmentDocument);
router.patch('/enrollment/:token/documents/:documentId/includes', requireEnrollmentTenant, PublicController.toggleEnrollmentDocumentIncludes);

// ==================== Webhooks ====================

router.post('/webhooks/clicksign', PublicController.handleClickSignWebhook);

// ==================== Re-Enrollment (Public) ====================

router.get('/re-enrollment/:token', formAccessLimiter, requireReEnrollmentTenant, PublicController.getReEnrollmentForm);
router.post('/re-enrollment/:token', formSubmitLimiter, requireReEnrollmentTenant, PublicController.submitReEnrollmentForm);
router.post('/re-enrollment/:token/documents', uploadLimiter, upload.array('files', 10), requireReEnrollmentTenant, PublicController.uploadReEnrollmentDocuments);

// ==================== Pre-Re-Enrollment (Public) ====================

router.get('/pre-reenrollment/:token', formAccessLimiter, requirePreReEnrollmentTenant, PublicController.getPreReEnrollmentData);
router.post('/pre-reenrollment/:token/respond', formSubmitLimiter, requirePreReEnrollmentTenant, PublicController.submitPreReEnrollmentResponse);

export default router;
