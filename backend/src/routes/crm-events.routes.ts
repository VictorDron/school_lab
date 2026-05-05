import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as CrmEventsController from '../controllers/crm-events.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// List & filter events (calendar)
router.get('/', CrmEventsController.list);

// Events by lead
router.get('/lead/:leadId', CrmEventsController.getByLeadId);

// Gate actions
router.post('/approve-visit', requireModuleAccess('CRM', 'EDIT'), CrmEventsController.approveVisit);
router.post('/reject-lead', requireModuleAccess('CRM', 'EDIT'), CrmEventsController.rejectLead);

// Single event CRUD
router.get('/:id', CrmEventsController.getById);
router.post('/', requireModuleAccess('CRM', 'EDIT'), CrmEventsController.create);
router.patch('/:id', requireModuleAccess('CRM', 'EDIT'), CrmEventsController.update);
router.delete('/:id', requireModuleAccess('CRM', 'ADMIN'), CrmEventsController.remove);

// Status updates
router.patch('/:id/status', requireModuleAccess('CRM', 'EDIT'), CrmEventsController.updateStatus);

export default router;
