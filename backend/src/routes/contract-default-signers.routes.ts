import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as DefaultSignersController from '../controllers/contract-default-signers.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', requireModuleAccess('STUDENT_MANAGEMENT', 'VIEW'), DefaultSignersController.list);
router.put('/', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), DefaultSignersController.replaceAll as any);
router.delete('/:id', requireModuleAccess('STUDENT_MANAGEMENT', 'EDIT'), DefaultSignersController.remove);

export default router;
