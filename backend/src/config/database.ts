import { Prisma, PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

// Connection error codes that should trigger a retry
const RETRYABLE_ERROR_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

function isRetryableError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.has(error.code);
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Error && error.message.includes('Server has closed the connection')) {
    return true;
  }
  return false;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  // Add retry middleware for transient connection errors
  client.$use(async (params, next) => {
    const MAX_QUERY_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_QUERY_RETRIES; attempt++) {
      try {
        return await next(params);
      } catch (error) {
        if (attempt < MAX_QUERY_RETRIES && isRetryableError(error)) {
          logger.warn(
            `Database query retry ${attempt}/${MAX_QUERY_RETRIES} for ${params.model}.${params.action}: ${(error as Error).message.substring(0, 100)}`
          );
          // Short delay before retry, increasing with each attempt
          await new Promise((resolve) => setTimeout(resolve, 200 * attempt));

          // Force reconnect on connection errors
          try {
            await client.$disconnect();
            await client.$connect();
          } catch {
            // Reconnect may fail, but the next query attempt will try again
          }
          continue;
        }
        throw error;
      }
    }

    // Should not reach here, but just in case
    return next(params);
  });

  return client;
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function connectDatabase() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect();
      logger.info(`Database connected successfully (attempt ${attempt})`);
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${(error as Error).message}`);
      if (attempt === MAX_RETRIES) {
        logger.error('Database connection failed after all retries:', error);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
