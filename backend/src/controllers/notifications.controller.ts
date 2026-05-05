import { Response } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import logger from '../utils/logger.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit, unreadOnly } = req.query;

    const parsedPage = Math.max(1, parseInt(page as string) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const result = await getUserNotifications(req.user!.id, {
      page: parsedPage,
      limit: parsedLimit,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user!.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    logger.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    await markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true, message: 'Todas as notificações marcadas como lidas' });
  } catch (error) {
    logger.error('Mark all read error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function removeNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await deleteNotification(req.params.id, req.user!.id);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
    }

    res.json({ success: true, message: 'Notificação removida' });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
