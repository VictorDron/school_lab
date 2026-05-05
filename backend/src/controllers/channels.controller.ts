import { Response } from 'express';
import { z } from 'zod';
import { getPaginationParams } from '../utils/helpers.js';
import { createAuditLog } from '../services/audit.service.js';
import * as ChannelsService from '../services/channels.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ChannelType } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler.js';
import { getIO } from '../socket/io.js';
import logger from '../utils/logger.js';

const createChannelSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(ChannelType).default('PUBLIC'),
  memberIds: z.array(z.string()).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
    storagePath: z.string().optional(),
  })).optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1, 'Mensagem não pode estar vazia'),
});

export async function getChannels(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const data = await ChannelsService.getChannelsForUser(userId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get channels error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getDirectMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const data = await ChannelsService.getDirectMessagesForUser(userId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get DMs error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createChannelSchema.parse(req.body);
    const userId = req.user!.id;

    const channel = await ChannelsService.createChannel(data, userId);

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'CHANNEL_CREATED',
      entityType: 'CHANNEL',
      entityId: channel.id,
      metadata: { name: data.name, type: data.type },
    }, req);

    res.status(201).json({ success: true, data: channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    logger.error('Create channel error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function createDirectMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { userId: targetUserId } = req.body;
    const currentUserId = req.user!.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, error: 'ID do usuário é obrigatório' });
    }

    const result = await ChannelsService.createOrGetDirectMessage(currentUserId, targetUserId);

    if (!result.isNew) {
      return res.json({ success: true, data: result.channel, message: 'Conversa já existe' });
    }

    await createAuditLog({
      actorId: currentUserId,
      actorEmail: req.user!.email,
      action: 'DM_CREATED',
      entityType: 'CHANNEL',
      entityId: result.channel.id,
      metadata: { targetUserId },
    }, req);

    res.status(201).json({ success: true, data: result.channel });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Create DM error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const { page, limit } = getPaginationParams(req.query);
    const userId = req.user!.id;

    const result = await ChannelsService.getMessages(channelId, userId, page, limit);
    res.json({ success: true, data: result.messages, meta: result.meta });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const data = sendMessageSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await ChannelsService.sendMessage(channelId, userId, data, req.user!.displayName);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:new', result.message);
    } catch (err) { logger.warn('Socket emit failed:', err); }

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'MESSAGE_SENT',
      entityType: 'CHANNEL',
      entityId: channelId,
    }, req);

    res.status(201).json({ success: true, data: result.message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function joinChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    const result = await ChannelsService.joinChannel(channelId, userId);

    if (result.alreadyMember) {
      return res.json({ success: true, message: 'Você já é membro deste canal' });
    }

    res.json({ success: true, message: 'Entrou no canal com sucesso' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Join channel error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function leaveChannel(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    await ChannelsService.leaveChannel(channelId, userId);
    res.json({ success: true, message: 'Saiu do canal com sucesso' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Leave channel error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getChannelMembers(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;

    const data = await ChannelsService.getChannelMembers(channelId, userId);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Get channel members error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== ENHANCED MESSAGING ====================

export async function editMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const data = editMessageSchema.parse(req.body);
    const userId = req.user!.id;

    const updated = await ChannelsService.editMessage(messageId, userId, data.content);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:edited', {
        messageId,
        channelId,
        content: data.content,
        isEdited: true,
      });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'MESSAGE_EDITED',
      entityType: 'MESSAGE',
      entityId: messageId,
    }, req);

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Edit message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user!.id;

    await ChannelsService.deleteMessage(messageId, userId, req.user!.role);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:deleted', { messageId, channelId });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'MESSAGE_DELETED',
      entityType: 'MESSAGE',
      entityId: messageId,
    }, req);

    res.json({ success: true, message: 'Mensagem excluída' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function pinMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user!.id;

    await ChannelsService.pinMessage(messageId, channelId, userId, req.user!.role);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:pinned', { messageId, channelId, pinnedBy: userId });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'MESSAGE_PINNED',
      entityType: 'MESSAGE',
      entityId: messageId,
    }, req);

    res.json({ success: true, message: 'Mensagem fixada' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Pin message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function unpinMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user!.id;

    await ChannelsService.unpinMessage(messageId, channelId, userId, req.user!.role);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('message:unpinned', { messageId, channelId });
    } catch (err) { logger.warn('Socket emit failed for unpin:', err); }

    await createAuditLog({
      actorId: userId,
      actorEmail: req.user!.email,
      action: 'MESSAGE_PINNED',
      entityType: 'MESSAGE',
      entityId: messageId,
      metadata: { action: 'unpin' },
    }, req);

    res.json({ success: true, message: 'Mensagem desfixada' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Unpin message error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getPinnedMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const data = await ChannelsService.getPinnedMessages(channelId);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get pinned messages error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function addReaction(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user!.id;

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji é obrigatório' });
    }

    const reaction = await ChannelsService.addReaction(messageId, channelId, userId, emoji);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('reaction:added', {
        messageId,
        channelId,
        userId,
        emoji,
        displayName: req.user!.displayName,
      });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    res.json({ success: true, data: reaction });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Add reaction error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function removeReaction(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId, emoji } = req.params;
    const userId = req.user!.id;

    const decodedEmoji = decodeURIComponent(emoji);
    await ChannelsService.removeReaction(messageId, userId, decodedEmoji);

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('reaction:removed', {
        messageId,
        channelId,
        userId,
        emoji: decodedEmoji,
      });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    res.json({ success: true, message: 'Reação removida' });
  } catch (error) {
    logger.error('Remove reaction error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== THREADS ====================

export async function getThreadReplies(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId } = req.params;
    const userId = req.user!.id;
    const { page, limit } = getPaginationParams(req.query);

    const result = await ChannelsService.getThreadReplies(channelId, messageId, userId, page, limit);
    res.json({ success: true, data: result.replies, meta: result.meta });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Get thread replies error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function sendThreadReply(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId, messageId: parentId } = req.params;
    const data = sendMessageSchema.parse(req.body);
    const userId = req.user!.id;

    const result = await ChannelsService.sendThreadReply(
      channelId, parentId, userId, data, req.user!.displayName,
    );

    try {
      const io = getIO();
      io.to(`channel:${channelId}`).emit('thread:reply', {
        parentId: result.parentId,
        message: result.reply,
        channelId,
      });
    } catch (err) { logger.warn('Socket emit failed:', err); }

    res.status(201).json({ success: true, data: result.reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Send thread reply error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== SEARCH ====================

export async function searchMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { q, senderId, startDate, endDate } = req.query;
    const channelId = req.params.channelId || (req.query.channelId as string);
    const { page, limit } = getPaginationParams(req.query);

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, error: 'Parâmetro de busca é obrigatório' });
    }

    const result = await ChannelsService.searchChannelMessages(q, req.user!.id, {
      page,
      limit,
      channelId,
      senderId: senderId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.json({ success: true, data: result.messages, meta: result.meta });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Search messages error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== FILE UPLOAD ====================

export async function uploadFiles(req: AuthenticatedRequest, res: Response) {
  try {
    const { channelId } = req.params;
    const userId = req.user!.id;
    const files = req.files as Express.Multer.File[];

    const result = await ChannelsService.uploadFiles(channelId, userId, files);

    res.json({
      success: true,
      data: result.attachments,
      ...(result.failed.length > 0 && { warning: `Falha no upload de: ${result.failed.join(', ')}` }),
      ...(result.rejected.length > 0 && { rejected: result.rejected }),
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Upload files error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== ATTACHMENT URL REFRESH ====================

export async function refreshAttachmentUrl(req: AuthenticatedRequest, res: Response) {
  try {
    const { url, storagePath } = req.body;

    if (!url && !storagePath) {
      return res.status(400).json({ success: false, error: 'URL ou storagePath obrigatório' });
    }

    const input = storagePath || url;
    const result = await ChannelsService.refreshAttachmentUrl(input);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    logger.error('Refresh attachment URL error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

// ==================== USER SEARCH (for mentions/DMs) ====================

export async function searchUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const q = (req.query.q as string) || '';
    const data = await ChannelsService.searchUsers(q);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
