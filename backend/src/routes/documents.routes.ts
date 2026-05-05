import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';
import * as DocumentsController from '../controllers/documents.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('GED', 'VIEW'));

router.get('/', DocumentsController.listDocuments);
router.get('/:id', DocumentsController.getDocumentById);
router.post('/', requireModuleAccess('GED', 'EDIT'), upload.single('file'), DocumentsController.uploadDocument);
router.patch('/:id', requireModuleAccess('GED', 'EDIT'), DocumentsController.updateDocument);
router.delete('/:id', DocumentsController.deleteDocument);

export default router;
