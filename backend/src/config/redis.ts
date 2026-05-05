import Redis from 'ioredis';
import { config } from './index.js';
import logger from '../utils/logger.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  keepAlive: 10000,
  connectTimeout: 10000,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});

let suppressReconnectLogs = false;

redis.on('connect', () => {
  if (suppressReconnectLogs) {
    suppressReconnectLogs = false;
    return;
  }
  logger.info('Redis connected successfully');
});

redis.on('error', (error: Error) => {
  if (error.message?.includes('ECONNRESET')) {
    if (!suppressReconnectLogs) {
      logger.warn('Redis connection reset — reconnecting silently');
      suppressReconnectLogs = true;
    }
    return;
  }
  logger.error('Redis connection error:', error);
});

export async function disconnectRedis() {
  await redis.quit();
  logger.info('Redis disconnected');
}
