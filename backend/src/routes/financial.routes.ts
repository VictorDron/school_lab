import { Router } from 'express';
import { authenticate, requireModuleAccess, requireRole } from '../middlewares/auth.js';
import * as FinancialController from '../controllers/financial.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

router.post('/analysis', requireModuleAccess('CRM', 'EDIT'), FinancialController.createAnalysis as any);
router.patch('/analysis/:id', requireModuleAccess('CRM', 'EDIT'), FinancialController.updateAnalysis as any);
router.patch('/analysis/:id/approve', requireRole('FINANCE', 'ADMIN'), FinancialController.approveAnalysis as any);
router.post('/payments/:id/record', requireRole('FINANCE', 'ADMIN'), FinancialController.recordPayment as any);

export default router;
