import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';
import { sendNotificationEmail } from './email.service.js';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendEmail?: boolean;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, data, sendEmail = false } = params;

  // Inherit tenantId from the recipient — every notification is for a
  // specific user and must live in their tenant.
  const recipient = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });
  if (!recipient) {
    throw new Error('NOTIFICATION_USER_NOT_FOUND');
  }

  const notification = await prisma.notification.create({
    data: {
      tenantId: recipient.tenantId,
      userId,
      type,
      title,
      message,
      data: data || {},
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
        },
      },
    },
  });

  // Publish to Redis for real-time delivery
  await redis.publish(`notifications:${userId}`, JSON.stringify(notification));

  // Send email notification if requested
  if (sendEmail && notification.user.email) {
    await sendNotificationEmail({
      to: notification.user.email,
      userName: notification.user.displayName,
      title,
      message,
      actionUrl: data?.actionUrl,
      actionText: data?.actionText,
    });
  }

  return notification;
}

export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({ ...params, userId })
    )
  );

  return notifications;
}

export async function getUserNotifications(userId: string, params: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  const { page = 1, limit = 20, unreadOnly = false } = params;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function deleteNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}
