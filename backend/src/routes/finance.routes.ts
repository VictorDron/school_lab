import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as FinanceController from '../controllers/finance.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('FINANCIAL', 'VIEW'));

// ==================== TUITIONS (mensalidade-base) ====================
router.get('/tuitions', FinanceController.listTuitions as any);
router.post('/tuitions', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.createTuition as any);
router.patch('/tuitions/:id', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.updateTuition as any);
router.delete('/tuitions/:id', requireModuleAccess('FINANCIAL', 'ADMIN'), FinanceController.deleteTuition as any);

// ==================== INVOICES (cobranças avulsas) ====================
router.get('/invoices', FinanceController.listInvoices as any);
router.post('/invoices', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.createInvoice as any);
router.patch('/invoices/:id', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.updateInvoice as any);
router.post('/invoices/:id/pay', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.markInvoicePaid as any);
router.delete('/invoices/:id', requireModuleAccess('FINANCIAL', 'ADMIN'), FinanceController.deleteInvoice as any);

// ==================== PAYABLES (contas a pagar) ====================
router.get('/payables', FinanceController.listPayables as any);
router.post('/payables', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.createPayable as any);
router.patch('/payables/:id', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.updatePayable as any);
router.post('/payables/:id/pay', requireModuleAccess('FINANCIAL', 'EDIT'), FinanceController.markPayablePaid as any);
router.delete('/payables/:id', requireModuleAccess('FINANCIAL', 'ADMIN'), FinanceController.deletePayable as any);

// ==================== CASH FLOW ====================
router.get('/cash-flow', FinanceController.getCashFlow as any);

export default router;
