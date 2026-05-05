import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import invitesRoutes from './invites.routes.js';
import ticketsRoutes from './tickets.routes.js';
import channelsRoutes from './channels.routes.js';
import purchasesRoutes from './purchases.routes.js';
import assetsRoutes from './assets.routes.js';
import leadsRoutes from './leads.routes.js';
import kanbanColumnsRoutes from './kanban-columns.routes.js';
import documentsRoutes from './documents.routes.js';
import settingsRoutes from './settings.routes.js';
import notificationsRoutes from './notifications.routes.js';
import auditRoutes from './audit.routes.js';
import publicRoutes from './public.routes.js';
import platformRoutes from './platform.routes.js';
import crmEventsRoutes from './crm-events.routes.js';
import evaluationsRoutes from './evaluations.routes.js';
import taskBoardsRoutes from './task-boards.routes.js';
import taskCardsRoutes from './task-cards.routes.js';
import calendarRoutes from './calendar.routes.js';
import suppliersRoutes from './suppliers.routes.js';
import moduleChannelsRoutes from './module-channels.routes.js';
import gateApprovalsRoutes from './gate-approvals.routes.js';
import contractsRoutes from './contracts.routes.js';
import financialRoutes from './financial.routes.js';
import escalationsRoutes from './escalations.routes.js';
import studentsRoutes from './students.routes.js';
import importRoutes from './import.routes.js';
import reEnrollmentRoutes from './re-enrollment.routes.js';
import addendumRoutes from './addendum.routes.js';
import contractDefaultSignersRoutes from './contract-default-signers.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'School Lab API is running',
    timestamp: new Date().toISOString(),
  });
});

// Public routes (no authentication required)
router.use('/public', publicRoutes);

// Platform-admin only — cross-tenant onboarding/management.
router.use('/platform', platformRoutes);

// Route modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/invites', invitesRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/channels', channelsRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/assets', assetsRoutes);
router.use('/leads', leadsRoutes);
router.use('/crm-events', crmEventsRoutes);
router.use('/evaluations', evaluationsRoutes);
router.use('/kanban-columns', kanbanColumnsRoutes);
router.use('/documents', documentsRoutes);
router.use('/settings', settingsRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/module-channels', moduleChannelsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit', auditRoutes);
router.use('/task-boards', taskBoardsRoutes);
router.use('/tasks', taskCardsRoutes);
router.use('/calendar', calendarRoutes);
router.use('/gate-approvals', gateApprovalsRoutes);
router.use('/contracts', contractsRoutes);
router.use('/financial', financialRoutes);
router.use('/escalations', escalationsRoutes);
router.use('/students', studentsRoutes);
router.use('/import', importRoutes);
router.use('/re-enrollment', reEnrollmentRoutes);
router.use('/addendums', addendumRoutes);
router.use('/contract-default-signers', contractDefaultSignersRoutes);

export default router;
