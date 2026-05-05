import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as SuppliersController from '../controllers/suppliers.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('PROCUREMENT', 'VIEW'));

router.get('/', SuppliersController.listSuppliers);
router.get('/:id', SuppliersController.getSupplierById);
router.post('/', requireModuleAccess('PROCUREMENT', 'EDIT'), SuppliersController.createSupplier);
router.patch('/:id', requireModuleAccess('PROCUREMENT', 'EDIT'), SuppliersController.updateSupplier);
router.delete('/:id', requireModuleAccess('PROCUREMENT', 'ADMIN'), SuppliersController.archiveSupplier);
router.get('/:id/orders', SuppliersController.listSupplierOrders);

export default router;
