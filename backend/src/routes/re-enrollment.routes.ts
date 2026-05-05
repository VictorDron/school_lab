import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAnyModuleAccess } from '../middlewares/auth.js';
import * as ReEnrollmentController from '../controllers/re-enrollment.controller.js';
import * as PreReEnrollmentController from '../controllers/pre-reenrollment.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Dual-permit authorization during CRM migration: either STUDENT_MANAGEMENT
// (legacy home of the re-enrollment admin) or CRM (target home) grants access.
// TODO: remove STUDENT_MANAGEMENT from dual-permit after Phase 4 completes (target: 2026-06-01).
const RE_ENROLLMENT_MODULES = ['STUDENT_MANAGEMENT', 'CRM'] as const;
const requireView = () => requireAnyModuleAccess([...RE_ENROLLMENT_MODULES], 'VIEW');
const requireEdit = () => requireAnyModuleAccess([...RE_ENROLLMENT_MODULES], 'EDIT');

router.use(authenticate);
router.use(requireView());

// Period CRUD
router.get('/periods', ReEnrollmentController.listPeriods);
router.get('/periods/:id', ReEnrollmentController.getPeriod);

// Kanban view: lean aggregated payload for the re-enrollment Kanban board
router.get('/periods/:periodId/kanban-view', ReEnrollmentController.getKanbanView);
router.post('/periods', requireEdit(), ReEnrollmentController.createPeriod);
router.patch('/periods/:id', requireEdit(), ReEnrollmentController.updatePeriod);
router.delete('/periods/:id', requireEdit(), ReEnrollmentController.deletePeriod);
router.patch('/periods/:id/transition', requireEdit(), ReEnrollmentController.transitionPeriod);

// Pre-re-enrollment dashboard & pricing (VIEW access for dashboard, EDIT for mutations)
router.get('/periods/:periodId/pre-reenrollment/dashboard', PreReEnrollmentController.getDashboard);
router.put('/periods/:periodId/pre-reenrollment/price-table', requireEdit(), PreReEnrollmentController.upsertPriceTable);
router.patch('/periods/:periodId/pre-reenrollment/adjustment', requireEdit(), PreReEnrollmentController.updateAdjustment);
router.post('/periods/:periodId/pre-reenrollment/exceptions', requireEdit(), PreReEnrollmentController.createException);
router.patch('/pre-reenrollment/exceptions/:exceptionId', requireEdit(), PreReEnrollmentController.updateException);
router.delete('/pre-reenrollment/exceptions/:exceptionId', requireEdit(), PreReEnrollmentController.deleteException);

// Exception approvals (Phase 27)
router.get('/periods/:periodId/pre-reenrollment/pending-approvals', PreReEnrollmentController.listPendingApprovals);
router.post('/pre-reenrollment/exceptions/:exceptionId/approval', requireEdit(), PreReEnrollmentController.submitExceptionApproval);

// Discount import (Phase 26)
router.get('/periods/:periodId/pre-reenrollment/import-discounts/template', PreReEnrollmentController.downloadDiscountTemplate);
router.post('/periods/:periodId/pre-reenrollment/import-discounts/preview', requireEdit(), upload.single('file'), PreReEnrollmentController.previewDiscountImport as any);
router.post('/periods/:periodId/pre-reenrollment/import-discounts/apply', requireEdit(), PreReEnrollmentController.applyDiscountImport);

// Pre-re-enrollment communication (Phase 12)
router.get('/periods/:periodId/pre-reenrollment/email-template', PreReEnrollmentController.getEmailTemplate);
router.put('/periods/:periodId/pre-reenrollment/email-template', requireEdit(), PreReEnrollmentController.updateEmailTemplate);
router.post('/periods/:periodId/pre-reenrollment/send-emails', requireEdit(), PreReEnrollmentController.sendEmails);
router.get('/periods/:periodId/pre-reenrollment/responses', PreReEnrollmentController.listResponses);
router.patch('/pre-reenrollment/responses/:responseId/negotiation', requireEdit(), PreReEnrollmentController.registerNegotiation);
router.post('/pre-reenrollment/responses/:responseId/resend', requireEdit(), PreReEnrollmentController.resendResponseEmail);
router.get('/periods/:periodId/pre-reenrollment/report', PreReEnrollmentController.getReport);

// Funnel & Bottleneck analysis (VIEW access)
router.get('/periods/:periodId/funnel', ReEnrollmentController.getFunnelData);
router.get('/periods/:periodId/bottlenecks', ReEnrollmentController.getBottleneckAnalysis);

// Dashboard & Timeline (VIEW access) — placed before invite routes for Express path specificity
router.get('/periods/:periodId/dashboard', ReEnrollmentController.getDashboardStats);
router.get('/periods/:periodId/timeline', ReEnrollmentController.getPeriodTimeline);

// Report (VIEW access)
router.get('/periods/:periodId/report', ReEnrollmentController.getPeriodReport);
router.get('/periods/:periodId/report/export', ReEnrollmentController.exportPeriodReport);

// Reminder scheduling (EDIT access)
router.post('/periods/:periodId/reminders/schedule', requireEdit(), ReEnrollmentController.scheduleReminders);
router.delete('/periods/:periodId/reminders', requireEdit(), ReEnrollmentController.removeReminders);

// Unified management view (all eligible students + their invite data)
router.get('/periods/:periodId/management', ReEnrollmentController.listUnifiedManagement);

// Batch invite operations (scoped to period) — placed before single-invite route for Express path specificity
router.get('/periods/:periodId/invites/eligible', ReEnrollmentController.listEligibleStudents);
router.post('/periods/:periodId/invites/batch', requireEdit(), ReEnrollmentController.batchCreateInvites);

// Invite management (scoped to period)
router.get('/periods/:periodId/invites', ReEnrollmentController.listInvites);
router.post('/periods/:periodId/invites', requireEdit(), ReEnrollmentController.createInvite);

// Invite detail (VIEW access) — single endpoint powering the detail page
router.get('/invites/:id', ReEnrollmentController.getInviteDetail);

// Invite timeline — StudentHistory scoped to this invite's period
router.get('/invites/:id/history', ReEnrollmentController.getInviteHistory);

// Invite actions (EDIT access)
router.post('/invites/:id/resend', requireEdit(), ReEnrollmentController.resendInvite);
router.post('/invites/:id/cancel', requireEdit(), ReEnrollmentController.cancelInvite);
router.patch('/invites/:id/extend-deadline', requireEdit(), ReEnrollmentController.extendInviteDeadline);

// Fee payment registration (on invite)
router.post(
  '/invites/:id/fee-payment',
  requireEdit(),
  upload.single('receipt'),
  ReEnrollmentController.registerFeePayment as any,
);

// Gate transition (on invite)
router.patch('/invites/:id/gate-transition', requireEdit(), ReEnrollmentController.transitionGate);

// Document review (approve/reject individual documents)
router.patch('/invites/:id/documents/:docId/review', requireEdit(), ReEnrollmentController.reviewInviteDocument);

// Regenerate invite link (for document resubmission)
router.post('/invites/:id/regenerate-link', requireEdit(), ReEnrollmentController.regenerateInviteLink);

// List documents for an invite
router.get('/invites/:id/documents', ReEnrollmentController.listInviteDocuments);

// Batch renewal contract creation (scoped to period)
router.post('/periods/:periodId/contracts/batch', requireEdit(), ReEnrollmentController.batchCreateContracts as any);

// Invite contract (get existing contract for an invite)
router.get('/invites/:id/contract', ReEnrollmentController.getInviteContract);

// Renewal contract creation for a specific invite
router.post(
  '/invites/:id/contract',
  requireEdit(),
  ReEnrollmentController.createRenewalContract as any,
);

export default router;
