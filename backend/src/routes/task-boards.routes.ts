import { Router } from 'express';
import {
  getBoards,
  getBoard,
  createBoard,
  updateBoard,
  archiveBoard,
  getBoardMembers,
  addBoardMember,
  removeBoardMember,
  getColumns,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
} from '../controllers/task-boards.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireModuleAccess('COMMUNICATION', 'VIEW'));

// Boards
router.get('/', getBoards as any);
router.post('/', requireModuleAccess('COMMUNICATION', 'EDIT'), createBoard as any);
router.get('/:boardId', getBoard as any);
router.patch('/:boardId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateBoard as any);
router.delete('/:boardId', requireModuleAccess('COMMUNICATION', 'EDIT'), archiveBoard as any);

// Board members
router.get('/:boardId/members', getBoardMembers as any);
router.post('/:boardId/members', requireModuleAccess('COMMUNICATION', 'EDIT'), addBoardMember as any);
router.delete('/:boardId/members/:userId', requireModuleAccess('COMMUNICATION', 'EDIT'), removeBoardMember as any);

// Columns
router.get('/:boardId/columns', getColumns as any);
router.post('/:boardId/columns', requireModuleAccess('COMMUNICATION', 'EDIT'), createColumn as any);
router.patch('/columns/:columnId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateColumn as any);
router.delete('/columns/:columnId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteColumn as any);
router.patch('/:boardId/columns/reorder', requireModuleAccess('COMMUNICATION', 'EDIT'), reorderColumns as any);

// Labels
router.get('/:boardId/labels', getLabels as any);
router.post('/:boardId/labels', requireModuleAccess('COMMUNICATION', 'EDIT'), createLabel as any);
router.patch('/labels/:labelId', requireModuleAccess('COMMUNICATION', 'EDIT'), updateLabel as any);
router.delete('/labels/:labelId', requireModuleAccess('COMMUNICATION', 'EDIT'), deleteLabel as any);

export default router;
