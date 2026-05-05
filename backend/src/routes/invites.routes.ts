import { Router } from 'express';
import {
  listInvites,
  getInvite,
  updateInvite,
  deleteInvite,
  resendInvite,
  getInviteStats
} from '../controllers/invites.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /invites - List all invites with optional filtering
router.get('/', requireRole('ADMIN'), listInvites);

// GET /invites/stats - Get invite statistics
router.get('/stats', requireRole('ADMIN'), getInviteStats);

// GET /invites/:id - Get single invite
router.get('/:id', requireRole('ADMIN'), getInvite);

// PATCH /invites/:id - Update invite (name, role)
router.patch('/:id', requireRole('ADMIN'), updateInvite);

// DELETE /invites/:id - Delete invite
router.delete('/:id', requireRole('ADMIN'), deleteInvite);

// POST /invites/:id/resend - Resend invite email
router.post('/:id/resend', requireRole('ADMIN'), resendInvite);

export default router;
