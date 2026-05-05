import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { disconnectRedis } from './config/redis.js';
import { initializeStorage } from './config/supabase.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { initializeSocket } from './socket/index.js';
import routes from './routes/index.js';
import logger from './utils/logger.js';
import { startReminderWorker, stopReminderWorker } from './workers/reminder.worker.js';

const app = express();
const httpServer = createServer(app);

// Trust proxy — Railway runs behind a reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// CORS
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsers — store raw body buffer for webhook HMAC verification
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting — excludes public routes and auth (auth has its own stricter limiter)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path.startsWith('/public/') ||
    req.path.startsWith('/api/public/') ||
    req.path.startsWith('/api/auth/'),
});
app.use('/api', limiter);

// Request logging
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');

  // Stop accepting new connections first
  httpServer.close(() => {
    logger.info('Server closed');
  });

  // Give in-flight requests time to complete
  await new Promise(resolve => setTimeout(resolve, 5000));

  await stopReminderWorker();
  await disconnectDatabase();
  await disconnectRedis();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await connectDatabase();
    await initializeStorage();
    
    try {
      startReminderWorker();
    } catch (workerErr) {
      logger.error('Failed to start reminder worker (non-critical)', { error: (workerErr as Error).message });
    }

    httpServer.listen(config.port, () => {
      logger.info(`RISYS API Server started on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
