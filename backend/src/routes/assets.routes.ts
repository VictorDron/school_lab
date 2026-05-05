import { Router } from 'express';
import { authenticate, requireModuleAccess, requireRole } from '../middlewares/auth.js';
import * as AssetsController from '../controllers/assets.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('ASSETS', 'VIEW'));

// ==================== Inventory (BEFORE /:id to prevent route conflict) ====================

router.get('/inventory', AssetsController.listInventorySessions);
router.post('/inventory', requireRole('ADMIN'), AssetsController.createInventorySession);
router.get('/inventory/:sessionId', AssetsController.getInventorySession);
router.post('/inventory/:sessionId/start', requireRole('ADMIN'), AssetsController.startInventory);
router.post('/inventory/:sessionId/items/:itemId/check', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.checkInventoryItem);
router.post('/inventory/:sessionId/complete', requireRole('ADMIN'), AssetsController.completeInventory);

// ==================== Maintenance dashboard (BEFORE /:id) ====================

router.get('/maintenance/upcoming', AssetsController.getUpcomingMaintenance);
router.get('/maintenance/overdue', AssetsController.getOverdueMaintenance);

// ==================== Config (BEFORE /:id) ====================

router.get('/config/categories', AssetsController.listCategories);
router.post('/config/categories', requireRole('ADMIN'), AssetsController.createCategory);
router.patch('/config/categories/:categoryId', requireRole('ADMIN'), AssetsController.updateCategory);
router.delete('/config/categories/:categoryId', requireRole('ADMIN'), AssetsController.deleteCategory);
router.get('/config/locations', AssetsController.listLocations);
router.post('/config/locations', requireRole('ADMIN'), AssetsController.createLocation);
router.patch('/config/locations/:locationId', requireRole('ADMIN'), AssetsController.updateLocation);
router.delete('/config/locations/:locationId', requireRole('ADMIN'), AssetsController.deleteLocation);

// ==================== Stats (BEFORE /:id) ====================

router.get('/stats/overview', AssetsController.getStatsOverview);

// ==================== Core CRUD (/:id routes LAST) ====================

router.get('/', AssetsController.listAssets);
router.post('/', requireRole('ADMIN'), AssetsController.createAsset);
router.get('/:id', AssetsController.getAssetById);
router.patch('/:id', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.updateAsset);
router.post('/:id/move', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.moveAsset);
router.post('/:id/assign', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.assignAsset);
router.post('/:id/decommission', requireRole('ADMIN'), AssetsController.decommissionAsset);
router.get('/:id/maintenance', AssetsController.getMaintenanceHistory);
router.post('/:id/maintenance', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.createMaintenance);
router.post('/:id/maintenance/:maintenanceId/complete', requireModuleAccess('ASSETS', 'EDIT'), AssetsController.completeMaintenance);

export default router;
