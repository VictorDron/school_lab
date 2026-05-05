import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { sendReEnrollmentInviteEmail } from '../email.service.js';
import { getIO } from '../../socket/io.js';
import logger from '../../utils/logger.js';

const REMINDER_BATCH_SIZE = 5;
const DEFAULT_REMINDER_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Send reminder emails for invites whose deadline lands inside the next
 * 7-day window. Sent in batches of 5 to avoid spiking the email service.
 * Anything outside the window is "skipped" — too early or already late.
 */
export async function sendPendingReminders(periodId: string) {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
  });

  if (!period) {
    logger.warn(`[Reminder] Period ${periodId} not found, skipping reminders`);
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const invites = await prisma.reEnrollmentInvite.findMany({
    where: {
      periodId,
      status: { in: ['SENT', 'OPENED'] },
      optOutReminders: false,
    },
    include: {
      student: {
        include: { lead: true, child: true },
      },
      period: true,
    },
  });

  const now = new Date();
  const windowMs = DEFAULT_REMINDER_WINDOW_DAYS * DAY_MS;

  const eligible = invites.filter((inv) => {
    const invAny = inv as Record<string, unknown>;
    const effectiveDeadline = (invAny.extendedDeadline as Date) ?? period.endDate;
    const timeUntilDeadline = effectiveDeadline.getTime() - now.getTime();
    return timeUntilDeadline > 0 && timeUntilDeadline <= windowMs;
  });

  let skipped = invites.length - eligible.length;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < eligible.length; i += REMINDER_BATCH_SIZE) {
    const batch = eligible.slice(i, i + REMINDER_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (invite) => {
        try {
          const lead = invite.student.lead;
          const child = invite.student.child;

          if (!lead?.primaryContactEmail) {
            logger.warn(`[Reminder] No email for invite ${invite.id}, skipping`);
            return 'skipped';
          }

          const invAny = invite as Record<string, unknown>;
          const effectiveDeadline = (invAny.extendedDeadline as Date) ?? period.endDate;

          await sendReEnrollmentInviteEmail({
            to: lead.primaryContactEmail,
            familyName: lead.familyName ?? lead.primaryContactName ?? '',
            studentName: child?.fullName ?? '',
            formLink: `${config.frontendUrl}/re-enrollment/${invite.token}`,
            suggestedGrade: invite.student.grade,
            deadline: effectiveDeadline,
          });

          return 'sent';
        } catch (err) {
          logger.warn(`[Reminder] Failed to send reminder for invite ${invite.id}:`, err);
          return 'failed';
        }
      })
    );

    for (const r of results) {
      if (r === 'sent') sent++;
      else if (r === 'failed') failed++;
      else skipped++;
    }
  }

  logger.info(`[Reminder] Period ${periodId}: sent=${sent}, failed=${failed}, skipped=${skipped}`);

  try {
    getIO()
      .to(`re-enrollment:${periodId}`)
      .emit('re-enrollment:reminders:sent', { sent, failed, skipped });
  } catch {
    // non-fatal
  }

  return { sent, failed, skipped };
}

export async function scheduleReminders(periodId: string, intervalMs: number = 86400000) {
  const { reminderQueue } = await import('../../queues/reminder.queue.js');

  const job = await reminderQueue.add(
    'check-reminders',
    { periodId, type: 'send-reminders' },
    {
      repeat: { every: intervalMs },
      jobId: `reminder-check-${periodId}`,
    }
  );

  logger.info(`[Reminder] Scheduled reminders for period ${periodId}, interval=${intervalMs}ms`);
  return job;
}

export async function removeReminders(periodId: string) {
  const { reminderQueue } = await import('../../queues/reminder.queue.js');

  const repeatableJobs = await reminderQueue.getRepeatableJobs();
  for (const rJob of repeatableJobs) {
    if (rJob.id === `reminder-check-${periodId}`) {
      await reminderQueue.removeRepeatableByKey(rJob.key);
      logger.info(`[Reminder] Removed repeatable job for period ${periodId}`);
    }
  }
}
