import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as EvaluationsController from '../controllers/evaluations.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// By event
router.get('/event/:eventId', EvaluationsController.getByEventId);

// By lead
router.get('/lead/:leadId', EvaluationsController.getByLeadId);

// Single evaluation CRUD
router.get('/:id', EvaluationsController.getById);
router.post('/', requireModuleAccess('CRM', 'EDIT'), EvaluationsController.create);
router.patch('/:id', requireModuleAccess('CRM', 'EDIT'), EvaluationsController.update);

// Decision
router.patch('/:id/decision', requireModuleAccess('CRM', 'EDIT'), EvaluationsController.makeDecision);

export default router;
