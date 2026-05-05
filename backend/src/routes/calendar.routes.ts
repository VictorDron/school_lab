import { Router } from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  respondToEvent,
  getUpcoming,
} from '../controllers/calendar.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('COMMUNICATION', 'VIEW'));

// Calendar events
router.get('/', getEvents as any);
router.get('/upcoming', getUpcoming as any);
router.post('/', requireModuleAccess('COMMUNICATION', 'EDIT'), createEvent as any);
router.get('/:eventId', getEvent as any);
router.patch('/:eventId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateEvent as any);
router.delete('/:eventId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteEvent as any);
router.post('/:eventId/rsvp', respondToEvent as any);

export default router;
