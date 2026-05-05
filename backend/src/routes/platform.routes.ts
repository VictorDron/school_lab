import { Router } from 'express';
import { authenticate, requirePlatformAdmin } from '../middlewares/auth.js';
import * as TenantsController from '../controllers/platform/tenants.controller.js';

/**
 * Phase 3b/4: cross-tenant operations only platform admins can perform.
 * Authenticated, then guarded by requirePlatformAdmin (the auth
 * middleware also intentionally skips runWithTenant for platform
 * admins so reads aren't tenant-scoped here).
 */
const router = Router();

router.use(authenticate, requirePlatformAdmin);

router.post('/tenants', TenantsController.postTenant);
router.get('/tenants', TenantsController.getTenants);
router.patch('/tenants/:id/status', TenantsController.patchTenantStatus);

export default router;
