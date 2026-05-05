import { Router } from 'express';
import multer from 'multer';
import {
  getChannels,
  getDirectMessages,
  createChannel,
  createDirectMessage,
  getMessages,
  sendMessage,
  joinChannel,
  leaveChannel,
  getChannelMembers,
  editMessage,
  deleteMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  addReaction,
  removeReaction,
  getThreadReplies,
  sendThreadReply,
  searchMessages,
  searchUsers,
  uploadFiles,
  refreshAttachmentUrl,
} from '../controllers/channels.controller.js';
import { authenticate, requireModuleAccess } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);
router.use(requireModuleAccess('COMMUNICATION', 'VIEW'));

// User search (for mentions and DM creation) — MUST come before /:channelId routes
router.get('/users/search', searchUsers as any);

// Attachment URL refresh (MUST come before /:channelId routes)
router.post('/attachments/refresh', refreshAttachmentUrl as any);

// Direct Messages (MUST come before /:channelId routes)
router.get('/dm', getDirectMessages);
router.post('/dm', createDirectMessage);

// Channels
router.get('/', getChannels);
router.post('/', requireModuleAccess('COMMUNICATION', 'EDIT'), createChannel);

// File upload
router.post('/:channelId/upload', validateUUID('channelId'), upload.array('files', 5), uploadFiles as any);

// Messages
router.get('/:channelId/messages', validateUUID('channelId'), getMessages);
router.post('/:channelId/messages', validateUUID('channelId'), sendMessage);
router.get('/:channelId/messages/search', validateUUID('channelId'), searchMessages);
router.patch('/:channelId/messages/:messageId', validateUUID('channelId', 'messageId'), editMessage);
router.delete('/:channelId/messages/:messageId', validateUUID('channelId', 'messageId'), deleteMessage);

// Pinning
router.get('/:channelId/messages/pinned', validateUUID('channelId'), getPinnedMessages);
router.post('/:channelId/messages/:messageId/pin', validateUUID('channelId', 'messageId'), pinMessage);
router.delete('/:channelId/messages/:messageId/pin', validateUUID('channelId', 'messageId'), unpinMessage);

// Reactions
router.post('/:channelId/messages/:messageId/reactions', validateUUID('channelId', 'messageId'), addReaction);
router.delete('/:channelId/messages/:messageId/reactions/:emoji', validateUUID('channelId', 'messageId'), removeReaction);

// Threads
router.get('/:channelId/messages/:messageId/replies', validateUUID('channelId', 'messageId'), getThreadReplies);
router.post('/:channelId/messages/:messageId/replies', validateUUID('channelId', 'messageId'), sendThreadReply);

// Channel membership
router.post('/:channelId/join', validateUUID('channelId'), joinChannel);
router.post('/:channelId/leave', validateUUID('channelId'), leaveChannel);
router.get('/:channelId/members', validateUUID('channelId'), getChannelMembers);

export default router;
