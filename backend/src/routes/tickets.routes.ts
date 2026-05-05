import { Router } from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  addComment,
  getTicketStats,
} from '../controllers/tickets.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('COMMUNICATION', 'VIEW'));

router.get('/', getTickets);
router.get('/stats', getTicketStats);
router.get('/:id', validateUUID('id'), getTicket);
router.post('/', requireModuleAccess('COMMUNICATION', 'EDIT'), createTicket);
router.patch('/:id', validateUUID('id'), requireModuleAccess('COMMUNICATION', 'EDIT'), updateTicket);
router.post('/:id/comments', validateUUID('id'), requireModuleAccess('COMMUNICATION', 'VIEW'), addComment);

export default router;
