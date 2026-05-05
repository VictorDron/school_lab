import { Router } from 'express';
import * as AddendumController from '../controllers/addendum.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

router.post('/', requireModuleAccess('CRM', 'EDIT'), AddendumController.create as any);
router.get('/contract/:contractId', AddendumController.listByContract as any);
router.post('/:id/generate-document', requireModuleAccess('CRM', 'EDIT'), AddendumController.generateDocument as any);
router.post('/:id/send', requireModuleAccess('CRM', 'EDIT'), AddendumController.sendForSignature as any);
router.post('/:id/cancel', requireModuleAccess('CRM', 'EDIT'), AddendumController.cancel as any);
router.get('/:id/document', AddendumController.getDocument as any);
router.get('/:id/signed-document', AddendumController.getSignedDocument as any);

export default router;
