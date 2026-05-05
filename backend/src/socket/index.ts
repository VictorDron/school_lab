import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { config } from '../config/index.js';
import { redis } from '../config/redis.js';
import { prisma } from '../config/database.js';
import { JwtPayload, SocketUser } from '../types/index.js';
import logger from '../utils/logger.js';
import { setIO } from './io.js';

const connectedUsers = new Map<string, SocketUser>();

export function initializeSocket(httpServer: HttpServer) {
  const allowedOrigins = config.socketCorsOrigin.split(',').map(o => o.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          displayName: true,
          status: true,
          tenantId: true,
          isPlatformAdmin: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('User not found or inactive'));
      }

      // Mirror the HTTP middleware's tenant-integrity check.
      if (!user.isPlatformAdmin && decoded.tenantId !== user.tenantId) {
        return next(new Error('Token tenant mismatch'));
      }

      socket.data.user = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      };
      socket.data.tenantId = user.tenantId;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`User connected: ${user.displayName} (${user.id})`);

    // Store connected user
    connectedUsers.set(user.id, {
      ...user,
      socketId: socket.id,
    });

    // Set online status in Redis
    await redis.set(`user:online:${user.id}`, 'true', 'EX', 300);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId: user.id });

    // Join user's personal room for notifications
    socket.join(`user:${user.id}`);

    // Subscribe to Redis for real-time notifications
    const notificationSubscriber = redis.duplicate();
    await notificationSubscriber.subscribe(`notifications:${user.id}`);
    notificationSubscriber.on('message', (channel, message) => {
      if (channel === `notifications:${user.id}`) {
        socket.emit('notification', JSON.parse(message));
      }
    });

    // Track channel subscribers to prevent memory leaks
    const channelSubscribers = new Map<string, Redis>();

    // Handle joining channels
    socket.on('channel:join', async (channelId: string) => {
      // Clean up existing subscriber for this channel if re-joining
      const existingSub = channelSubscribers.get(channelId);
      if (existingSub) {
        await existingSub.unsubscribe(`channel:${channelId}`);
        await existingSub.quit();
        channelSubscribers.delete(channelId);
      }

      socket.join(`channel:${channelId}`);
      logger.debug(`${user.displayName} joined channel ${channelId}`);

      // Subscribe to channel messages
      const channelSubscriber = redis.duplicate();
      await channelSubscriber.subscribe(`channel:${channelId}`);
      channelSubscriber.on('message', (channel, message) => {
        if (channel === `channel:${channelId}`) {
          socket.emit('message:new', JSON.parse(message));
        }
      });

      channelSubscribers.set(channelId, channelSubscriber);
    });

    // Handle leaving channels - cleanup subscriber
    socket.on('channel:leave', async (channelId: string) => {
      socket.leave(`channel:${channelId}`);
      logger.debug(`${user.displayName} left channel ${channelId}`);

      const subscriber = channelSubscribers.get(channelId);
      if (subscriber) {
        await subscriber.unsubscribe(`channel:${channelId}`);
        await subscriber.quit();
        channelSubscribers.delete(channelId);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:start', {
        userId: user.id,
        displayName: user.displayName,
        channelId,
      });
    });

    socket.on('typing:stop', (channelId: string) => {
      socket.to(`channel:${channelId}`).emit('typing:stop', {
        userId: user.id,
        channelId,
      });
    });

    // === CRM Real-time: Room handlers (per D-04) ===

    // Join CRM pipeline room for list-level updates
    socket.on('crm:pipeline:join', () => {
      socket.join('crm:pipeline');
      logger.debug(`${user.displayName} joined crm:pipeline`);
    });

    socket.on('crm:pipeline:leave', () => {
      socket.leave('crm:pipeline');
      logger.debug(`${user.displayName} left crm:pipeline`);
    });

    // === Students Real-time: Room handlers (per D-14) ===
    socket.on('students:list:join', () => {
      socket.join('students:list');
      logger.debug(`${user.displayName} joined students:list`);
    });

    socket.on('students:list:leave', () => {
      socket.leave('students:list');
      logger.debug(`${user.displayName} left students:list`);
    });

    // === Re-enrollment Real-time: Room handlers ===
    socket.on('re-enrollment:period:join', (periodId: string) => {
      socket.join(`re-enrollment:${periodId}`);
      logger.debug(`${user.displayName} joined re-enrollment:${periodId}`);
    });

    socket.on('re-enrollment:period:leave', (periodId: string) => {
      socket.leave(`re-enrollment:${periodId}`);
      logger.debug(`${user.displayName} left re-enrollment:${periodId}`);
    });

    // === Pre-Re-enrollment Real-time: Room handlers ===
    socket.on('pre-reenrollment:period:join', (periodId: string) => {
      socket.join(`pre-reenrollment:${periodId}`);
      logger.debug(`${user.displayName} joined pre-reenrollment:${periodId}`);
    });

    socket.on('pre-reenrollment:period:leave', (periodId: string) => {
      socket.leave(`pre-reenrollment:${periodId}`);
      logger.debug(`${user.displayName} left pre-reenrollment:${periodId}`);
    });

    // Join lead-specific room for detail-level updates
    socket.on('crm:lead:join', (leadId: string) => {
      socket.join(`lead:${leadId}`);
      logger.debug(`${user.displayName} joined lead:${leadId}`);
    });

    socket.on('crm:lead:leave', (leadId: string) => {
      socket.leave(`lead:${leadId}`);
      logger.debug(`${user.displayName} left lead:${leadId}`);
    });

    // Heartbeat to keep online status
    const heartbeatInterval = setInterval(async () => {
      await redis.set(`user:online:${user.id}`, 'true', 'EX', 300);
    }, 60000);

    // Handle disconnect - cleanup ALL subscribers
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${user.displayName}`);

      connectedUsers.delete(user.id);
      clearInterval(heartbeatInterval);

      // Remove online status after a delay (allows reconnection)
      setTimeout(async () => {
        if (!connectedUsers.has(user.id)) {
          await redis.del(`user:online:${user.id}`);
          socket.broadcast.emit('user:offline', { userId: user.id });
        }
      }, 5000);

      // Cleanup all channel subscribers
      for (const [channelId, subscriber] of channelSubscribers) {
        try {
          await subscriber.unsubscribe(`channel:${channelId}`);
          await subscriber.quit();
        } catch (err) {
          logger.warn(`Failed to cleanup channel subscriber ${channelId}:`, err);
        }
      }
      channelSubscribers.clear();

      await notificationSubscriber.quit();
    });
  });

  // Register io globally so services can call getIO() to emit events
  setIO(io);

  // === CRM Real-time: Global Redis subscriber ===
  // One shared subscriber for all CRM pipeline events — not per-connection
  const crmListSubscriber = redis.duplicate();
  crmListSubscriber.subscribe('crm:leads:list').then(() => {
    crmListSubscriber.on('message', (channel, message) => {
      if (channel === 'crm:leads:list') {
        try {
          io.to('crm:pipeline').emit('crm:lead:list-updated', JSON.parse(message));
        } catch (err) {
          logger.warn('Failed to broadcast CRM list update:', err);
        }
      }
    });
  }).catch((err) => {
    logger.warn('Failed to subscribe to CRM Redis channel:', err);
  });

  // === Students Real-time: Global Redis subscriber ===
  const studentsListSubscriber = redis.duplicate();
  studentsListSubscriber.subscribe('students:list').then(() => {
    studentsListSubscriber.on('message', (channel, message) => {
      if (channel === 'students:list') {
        try {
          io.to('students:list').emit('students:list:updated', JSON.parse(message));
        } catch (err) {
          logger.warn('Failed to broadcast students list update:', err);
        }
      }
    });
  }).catch((err) => {
    logger.warn('Failed to subscribe to students Redis channel:', err);
  });

  return io;
}

export function getConnectedUsers() {
  return Array.from(connectedUsers.values());
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}
