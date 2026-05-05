import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as GateApprovalController from '../controllers/gate-approval.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// Gate config
router.get('/config', GateApprovalController.getConfig as any);

// My pending approval tasks
router.get('/my-pending', GateApprovalController.getMyPendingApprovals as any);

// Pending approvals summary
router.get('/pending-summary', GateApprovalController.getPendingSummary as any);

// Pipeline status for a lead
router.get('/:leadId/pipeline', GateApprovalController.getPipelineStatus as any);

// All approvals for a lead
router.get('/:leadId', GateApprovalController.getLeadApprovals as any);

// Approvals for a specific gate step
router.get('/:leadId/:gateStep', GateApprovalController.getGateApprovals as any);

// Manual gate transition (ADMIN only — enforced in controller via force flag)
router.post('/:leadId/transition', requireModuleAccess('CRM', 'ADMIN'), GateApprovalController.transitionGate as any);

// Submit departmental approval
router.post('/:leadId/:gateStep', requireModuleAccess('CRM', 'EDIT'), GateApprovalController.submitApproval as any);

export default router;
