/**
 * SEC-01 Route Guard Audit (Phase 1 Security — Plan 02)
 * PATCH /:id/legal      — requireRole('LEGAL', 'ADMIN')        ✓ correct
 * PATCH /:id/financial  — requireRole('FINANCE', 'ADMIN')      ✓ correct
 * POST  /:id/cancel     — requireModuleAccess('CRM', 'EDIT')   ✓ correct (all CRM editors can cancel)
 * Defense in depth: service layer also enforces role on legal/financial (SEC-01)
 *
 * Other sensitive operations audited:
 * gate-approvals.routes.ts: POST /:leadId/:gateStep → requireModuleAccess('CRM', 'EDIT')   ✓ correct
 * gate-approvals.routes.ts: POST /:leadId/transition → requireModuleAccess('CRM', 'ADMIN') ✓ correct
 * crm-events.routes.ts: POST /approve-visit → requireModuleAccess('CRM', 'EDIT')           ✓ correct
 * crm-events.routes.ts: POST /reject-lead  → requireModuleAccess('CRM', 'EDIT')            ✓ correct
 * financial.routes.ts: PATCH /analysis/:id/approve → requireRole('FINANCE', 'ADMIN')       ✓ correct
 * purchases.routes.ts: POST /:id/approve → requireModuleAccess('PROCUREMENT', 'ADMIN')     ✓ correct
 * purchases.routes.ts: POST /:id/cancel  → requireModuleAccess('PROCUREMENT', 'EDIT')      ✓ correct
 * leads.routes.ts: DELETE /:id/token          → requireModuleAccess('CRM', 'EDIT')         ✓ correct
 * leads.routes.ts: DELETE /:id/enrollment-token → requireModuleAccess('CRM', 'EDIT')       ✓ correct
 */
import { Router } from 'express';
import { authenticate, requireModuleAccess, requireRole } from '../middlewares/auth.js';
import * as ContractController from '../controllers/contract.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

router.get('/prerequisites/:leadId', ContractController.getPrerequisites as any);
router.get('/lead/:leadId', ContractController.getByLeadId as any);
router.post('/', requireModuleAccess('CRM', 'EDIT'), ContractController.create as any);
router.post('/:id/generate-document', requireModuleAccess('CRM', 'EDIT'), ContractController.generateDocument as any);
router.post('/:id/send', requireModuleAccess('CRM', 'EDIT'), ContractController.sendForSignature as any);
router.patch('/:id/legal', requireRole('LEGAL', 'ADMIN'), ContractController.submitLegalApproval as any);
router.patch('/:id/financial', requireRole('FINANCE', 'ADMIN'), ContractController.submitFinancialApproval as any);
router.post('/:id/signers', requireModuleAccess('CRM', 'EDIT'), ContractController.addSigner as any);
router.patch('/:id/signers/:signerId', requireModuleAccess('CRM', 'EDIT'), ContractController.updateSigner as any);
router.delete('/:id/signers/:signerId', requireModuleAccess('CRM', 'EDIT'), ContractController.removeSigner as any);
router.post('/:id/cancel', requireModuleAccess('CRM', 'EDIT'), ContractController.cancel as any);
router.get('/:id/document', ContractController.getDocument as any);
router.get('/:id/signed-document', ContractController.getSignedDocument as any);
router.delete('/:id', requireModuleAccess('CRM', 'ADMIN'), ContractController.deleteContract as any);

export default router;
