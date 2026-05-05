import { Router } from 'express';
import {
  getCards,
  getCard,
  createCard,
  updateCard,
  moveCard,
  assignUser,
  unassignUser,
  addLabel,
  removeLabel,
  completeCard,
  reopenCard,
  archiveCard,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  getComments,
  addComment,
  updateComment,
  deleteComment,
} from '../controllers/task-cards.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('COMMUNICATION', 'VIEW'));

// Cards
router.get('/boards/:boardId/cards', getCards as any);
router.post('/boards/:boardId/cards', requireModuleAccess('COMMUNICATION', 'EDIT'), createCard as any);
router.get('/cards/:cardId', getCard as any);
router.patch('/cards/:cardId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateCard as any);
router.post('/cards/:cardId/move', requireModuleAccess('COMMUNICATION', 'EDIT'), moveCard as any);

// Assignments
router.post('/cards/:cardId/assign', requireModuleAccess('COMMUNICATION', 'EDIT'), assignUser as any);
router.delete('/cards/:cardId/assign/:userId', requireModuleAccess('COMMUNICATION', 'EDIT'), unassignUser as any);

// Labels on cards
router.post('/cards/:cardId/labels', requireModuleAccess('COMMUNICATION', 'EDIT'), addLabel as any);
router.delete('/cards/:cardId/labels/:labelId', requireModuleAccess('COMMUNICATION', 'EDIT'), removeLabel as any);

// Status
router.post('/cards/:cardId/complete', requireModuleAccess('COMMUNICATION', 'EDIT'), completeCard as any);
router.post('/cards/:cardId/reopen', requireModuleAccess('COMMUNICATION', 'EDIT'), reopenCard as any);
router.delete('/cards/:cardId', requireModuleAccess('COMMUNICATION', 'EDIT'), archiveCard as any);

// Checklists
router.post('/cards/:cardId/checklists', requireModuleAccess('COMMUNICATION', 'EDIT'), createChecklist as any);
router.patch('/checklists/:checklistId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateChecklist as any);
router.delete('/checklists/:checklistId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteChecklist as any);
router.post('/checklists/:checklistId/items', requireModuleAccess('COMMUNICATION', 'EDIT'), addChecklistItem as any);
router.patch('/checklists/:checklistId/items/:itemId', requireModuleAccess('COMMUNICATION', 'EDIT'), toggleChecklistItem as any);
router.delete('/checklists/:checklistId/items/:itemId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteChecklistItem as any);

// Comments
router.get('/cards/:cardId/comments', getComments as any);
router.post('/cards/:cardId/comments', requireModuleAccess('COMMUNICATION', 'EDIT'), addComment as any);
router.patch('/comments/:commentId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateComment as any);
router.delete('/comments/:commentId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteComment as any);

export default router;
