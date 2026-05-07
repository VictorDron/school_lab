import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as TeamController from '../controllers/team.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('TEAM_MANAGEMENT', 'VIEW'));

// ==================== DEPARTMENTS ====================
router.get('/departments', TeamController.listDepartments as any);
router.post('/departments', requireModuleAccess('TEAM_MANAGEMENT', 'EDIT'), TeamController.createDepartment as any);
router.patch('/departments/:id', requireModuleAccess('TEAM_MANAGEMENT', 'EDIT'), TeamController.updateDepartment as any);
router.delete('/departments/:id', requireModuleAccess('TEAM_MANAGEMENT', 'ADMIN'), TeamController.deleteDepartment as any);

// ==================== POSITIONS ====================
router.get('/positions', TeamController.listPositions as any);
router.post('/positions', requireModuleAccess('TEAM_MANAGEMENT', 'EDIT'), TeamController.createPosition as any);
router.patch('/positions/:id', requireModuleAccess('TEAM_MANAGEMENT', 'EDIT'), TeamController.updatePosition as any);
router.delete('/positions/:id', requireModuleAccess('TEAM_MANAGEMENT', 'ADMIN'), TeamController.deletePosition as any);

// ==================== EMPLOYEES ====================
router.get('/employees', TeamController.listEmployees as any);
router.get('/employees/:id', TeamController.getEmployee as any);
router.patch('/employees/:id', requireModuleAccess('TEAM_MANAGEMENT', 'EDIT'), TeamController.updateEmployee as any);

// ==================== ORG CHART ====================
router.get('/org-chart', TeamController.getOrgChart as any);

export default router;
