import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';
import {
  getNotifications,
  markAsRead,
  markAllRead,
  removeNotification,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications as any);
router.patch('/read-all', markAllRead as any);
router.patch('/:id/read', validateUUID('id'), markAsRead as any);
router.delete('/:id', validateUUID('id'), removeNotification as any);

export default router;
