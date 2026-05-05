import { Router } from 'express';
import { authenticate, requireModuleAccess, requireRole } from '../middlewares/auth.js';
import * as EscalationController from '../controllers/escalation.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// List active escalations
router.get('/', EscalationController.getActiveEscalations as any);

// Escalations for a specific lead
router.get('/lead/:leadId', EscalationController.getLeadEscalations as any);

// Create escalation
router.post('/', requireModuleAccess('CRM', 'EDIT'), EscalationController.createEscalation as any);

// Resolve escalation (DIRECTOR or ADMIN only)
router.patch('/:id/resolve', requireRole('DIRECTOR', 'ADMIN'), EscalationController.resolveEscalation as any);

export default router;
