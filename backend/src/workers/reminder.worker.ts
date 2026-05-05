import { Worker, Job } from 'bullmq';
import { config } from '../config/index.js';
import { sendPendingReminders } from '../services/re-enrollment-communication.service.js';
import logger from '../utils/logger.js';

const QUEUE_NAME = 're-enrollment-reminders';

let worker: Worker | null = null;

export function startReminderWorker(): void {
  if (worker) {
    logger.warn('Reminder worker already running');
    return;
  }

  worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { type, periodId } = job.data as { type: string; periodId?: string };

      switch (type) {
        case 'send-reminders': {
          if (!periodId) {
            logger.warn('send-reminders job missing periodId', { jobId: job.id });
            return;
          }
          const result = await sendPendingReminders(periodId);
          logger.info('Reminders processed', { periodId, ...result });
          return result;
        }

        default:
          logger.warn(`Unknown reminder job type: ${type}`, { jobId: job.id });
      }
    },
    {
      connection: { url: config.redisUrl },
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`Reminder job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Reminder job ${job?.id} failed: ${err.message}`, {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info('Reminder worker started');
}

export async function stopReminderWorker(): Promise<void> {
  if (!worker) return;

  await worker.close();
  worker = null;
  logger.info('Reminder worker stopped');
}
