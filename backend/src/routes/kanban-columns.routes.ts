import { Router } from 'express';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import * as KanbanColumnsController from '../controllers/kanban-columns.controller.js';

const router = Router();

// Protected routes
router.use(authenticate);
router.use(requireModuleAccess('CRM', 'VIEW'));

// Reorder route (MUST be before /:id to avoid conflict)
router.patch('/reorder', requireModuleAccess('CRM', 'ADMIN'), KanbanColumnsController.reorder);

// Column CRUD
router.get('/', KanbanColumnsController.list);
router.get('/:id', KanbanColumnsController.getById);
router.post('/', requireModuleAccess('CRM', 'ADMIN'), KanbanColumnsController.create);
router.patch('/:id', requireModuleAccess('CRM', 'ADMIN'), KanbanColumnsController.update);
router.delete('/:id', requireModuleAccess('CRM', 'ADMIN'), KanbanColumnsController.remove);

export default router;
