import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as PurchasesController from '../controllers/purchases.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('PROCUREMENT', 'VIEW'));

// Stats (BEFORE /:id to prevent route conflict)
router.get('/stats/overview', PurchasesController.getStatsOverview);

// Core CRUD
router.get('/', PurchasesController.listPurchases);
router.post('/', requireModuleAccess('PROCUREMENT', 'EDIT'), PurchasesController.createPurchase);
router.get('/:id', PurchasesController.getPurchaseById);
router.patch('/:id', requireModuleAccess('PROCUREMENT', 'EDIT'), PurchasesController.updatePurchase);
router.post('/:id/submit', requireModuleAccess('PROCUREMENT', 'EDIT'), PurchasesController.submitPurchase);
router.post('/:id/approve', requireModuleAccess('PROCUREMENT', 'ADMIN'), PurchasesController.approvePurchase);
router.post('/:id/cancel', requireModuleAccess('PROCUREMENT', 'EDIT'), PurchasesController.cancelPurchase);
router.post('/:id/execute', requireModuleAccess('PROCUREMENT', 'ADMIN'), PurchasesController.executePurchase);

export default router;
