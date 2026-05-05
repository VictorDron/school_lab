import { Router } from 'express';
import multer from 'multer';
import type { Request, Response } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as LeadsController from '../controllers/leads.controller.js';
import { prisma } from '../config/database.js';
import logger from '../utils/logger.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Protected routes
router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// Stats routes (before :id to avoid conflict)
router.get('/stats/overview', LeadsController.getStats);
router.get('/stats/pipeline', LeadsController.getPipeline);
router.get('/stats/dashboard', LeadsController.getDashboard as any);

// Unviewed leads count (for badge in sidebar)
router.get('/unviewed-count', LeadsController.getUnviewedCount);
router.post('/mark-all-viewed', LeadsController.markAllViewed);

// Lead CRUD
router.get('/', LeadsController.list);
router.get('/:id', LeadsController.getById);
router.post('/', requireModuleAccess('CRM', 'EDIT'), LeadsController.create);
router.patch('/:id', requireModuleAccess('CRM', 'EDIT'), LeadsController.update);
router.delete('/:id', requireModuleAccess('CRM', 'ADMIN'), LeadsController.remove);

// Lead actions
router.patch('/:id/column', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateColumn);
router.patch('/:id/flag', requireModuleAccess('CRM', 'EDIT'), LeadsController.toggleFlag);
router.post('/:id/application-link', requireModuleAccess('CRM', 'EDIT'), LeadsController.generateLink);
router.post('/:id/application-link/send-email', requireModuleAccess('CRM', 'EDIT'), LeadsController.sendApplicationLinkEmail);
router.get('/:id/token-status', LeadsController.getTokenStatus);
router.delete('/:id/token', requireModuleAccess('CRM', 'EDIT'), LeadsController.revokeToken);
router.post('/:id/mark-viewed', LeadsController.markViewed);
router.patch('/:id/application-status', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateApplicationStatus);

// Enrollment (Matrícula) actions
router.post('/:id/enrollment-link', requireModuleAccess('CRM', 'EDIT'), LeadsController.generateEnrollmentLink);
router.post('/:id/enrollment-link/send-email', requireModuleAccess('CRM', 'EDIT'), LeadsController.sendEnrollmentLinkEmail);
router.get('/:id/enrollment-status', LeadsController.getEnrollmentTokenStatus);
router.delete('/:id/enrollment-token', requireModuleAccess('CRM', 'EDIT'), LeadsController.revokeEnrollmentToken);

// Comments
router.post('/:id/comments', requireModuleAccess('CRM', 'VIEW'), LeadsController.addComment);
router.delete('/:id/comments/:commentId', requireModuleAccess('CRM', 'EDIT'), LeadsController.deleteComment);

// Children
router.post('/:id/children', requireModuleAccess('CRM', 'EDIT'), LeadsController.addChild);
router.patch('/:id/children/:childId', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateChild);
router.delete('/:id/children/:childId', requireModuleAccess('CRM', 'EDIT'), LeadsController.deleteChild);

// Parents
router.patch('/:id/parents/:parentId', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateParent as any);

// Address
router.patch('/:id/address', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateAddress as any);

// Child Health
router.patch('/:id/children/:childId/health', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateChildHealth as any);

// Child Transport
router.patch('/:id/children/:childId/transport', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateChildTransport as any);

// Emergency Contacts
router.post('/:id/emergency-contacts', requireModuleAccess('CRM', 'EDIT'), LeadsController.createEmergencyContact as any);
router.patch('/:id/emergency-contacts/:contactId', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateEmergencyContact as any);
router.delete('/:id/emergency-contacts/:contactId', requireModuleAccess('CRM', 'EDIT'), LeadsController.deleteEmergencyContact as any);

// Financial Responsible
router.patch('/:id/financial-responsible', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateFinancialResponsible as any);

// Health Plan
router.patch('/:id/health-plan', requireModuleAccess('CRM', 'EDIT'), LeadsController.updateHealthPlan as any);

// Documents (Admission)
router.post('/:id/documents', requireModuleAccess('CRM', 'EDIT'), upload.single('file'), LeadsController.uploadDocument);
router.delete('/:id/documents/:docId', requireModuleAccess('CRM', 'EDIT'), LeadsController.deleteDocument);

// Documents (Enrollment / Matrícula)
router.patch('/:id/enrollment-documents/:docId/review', requireModuleAccess('CRM', 'EDIT'), LeadsController.reviewEnrollmentDocument);
router.delete('/:id/enrollment-documents/:docId', requireModuleAccess('CRM', 'EDIT'), LeadsController.deleteEnrollmentDocument);

// Parental consent records (SEC-05 — LGPD audit trail)
router.get('/:leadId/parental-consents', async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    const consents = await prisma.parentalConsent.findMany({
      where: { leadId },
      orderBy: { consentedAt: 'desc' },
      select: {
        id: true,
        leadId: true,
        ipAddress: true,
        userAgent: true,
        consentTextVersion: true,
        consentedAt: true,
      },
    });

    res.json({ success: true, data: consents });
  } catch (error) {
    logger.error('Get parental consents error', { leadId: req.params.leadId });
    res.status(500).json({ success: false, error: 'Erro ao buscar registros de consentimento.' });
  }
});

export default router;
