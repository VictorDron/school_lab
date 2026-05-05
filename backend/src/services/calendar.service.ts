import { prisma } from '../config/database.js';
import logger from '../utils/logger.js';

interface CalendarEventWithRecurrence {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location: string | null;
  color: string | null;
  channelId: string | null;
  taskCardId: string | null;
  createdById: string;
  isRecurring: boolean;
  recurrenceFrequency: string | null;
  recurrenceInterval: number | null;
  recurrenceEndDate: Date | null;
  [key: string]: any;
}

interface VirtualEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location: string | null;
  color: string | null;
  channelId: string | null;
  taskCardId: string | null;
  createdById: string;
  isRecurring: boolean;
  isVirtual: boolean;
  originalEventId: string;
  [key: string]: any;
}

function advanceDate(date: Date, frequency: string, interval: number): Date {
  const next = new Date(date);

  switch (frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + interval);
      break;
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * interval);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      break;
  }

  return next;
}

export function generateRecurrenceInstances(
  event: CalendarEventWithRecurrence,
  startDate: Date,
  endDate: Date
): VirtualEvent[] {
  const instances: VirtualEvent[] = [];

  if (!event.isRecurring || !event.recurrenceFrequency) {
    return instances;
  }

  const interval = event.recurrenceInterval || 1;
  const recurrenceEnd = event.recurrenceEndDate
    ? new Date(event.recurrenceEndDate)
    : endDate;
  const effectiveEnd = recurrenceEnd < endDate ? recurrenceEnd : endDate;

  const duration = event.endTime.getTime() - event.startTime.getTime();
  let currentStart = new Date(event.startTime);

  // Advance to the first occurrence at or after startDate
  while (currentStart < startDate) {
    currentStart = advanceDate(currentStart, event.recurrenceFrequency, interval);
  }

  while (currentStart <= effectiveEnd) {
    // Skip the original event instance (it's already included)
    if (currentStart.getTime() !== event.startTime.getTime()) {
      const currentEnd = new Date(currentStart.getTime() + duration);

      instances.push({
        id: `${event.id}_${currentStart.toISOString()}`,
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        startTime: new Date(currentStart),
        endTime: currentEnd,
        isAllDay: event.isAllDay,
        location: event.location,
        color: event.color,
        channelId: event.channelId,
        taskCardId: event.taskCardId,
        createdById: event.createdById,
        isRecurring: true,
        isVirtual: true,
        originalEventId: event.id,
      });
    }

    currentStart = advanceDate(currentStart, event.recurrenceFrequency, interval);
  }

  return instances;
}

export async function mergeTaskDeadlines(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<VirtualEvent[]> {
  try {
    const taskCards = await prisma.taskCard.findMany({
      where: {
        assignees: {
          some: { userId },
        },
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'ARCHIVED',
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
      },
    });

    return taskCards
      .filter((card) => card.dueDate !== null)
      .map((card) => ({
        id: card.id,
        title: card.title,
        description: null,
        eventType: 'DEADLINE',
        startTime: card.dueDate!,
        endTime: card.dueDate!,
        isAllDay: true,
        location: null,
        color: '#EF4444',
        channelId: null,
        taskCardId: card.id,
        createdById: userId,
        isRecurring: false,
        isVirtual: true,
        originalEventId: card.id,
      }));
  } catch (error) {
    logger.error('Merge task deadlines error:', error);
    return [];
  }
}
