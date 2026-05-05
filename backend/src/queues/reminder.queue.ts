import { Queue } from 'bullmq';
import { config } from '../config/index.js';

export const reminderQueue = new Queue('re-enrollment-reminders', {
  connection: { url: config.redisUrl },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
