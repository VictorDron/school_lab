import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middlewares/auth.js';
import * as SettingsController from '../controllers/settings.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', SettingsController.getSettings);

router.patch(
  '/',
  authenticate,
  requireRole('ADMIN'),
  SettingsController.updateSettings,
);

router.patch(
  '/logo',
  authenticate,
  requireRole('ADMIN'),
  upload.single('logo'),
  SettingsController.updateLogo,
);

router.get('/fees', authenticate, SettingsController.getFees);

router.patch(
  '/fees',
  authenticate,
  requireRole('ADMIN', 'FINANCE', 'LEGAL'),
  SettingsController.updateFees,
);

export default router;
