import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { createAuditLog } from "../services/audit.service.js";
import { createNotification } from "../services/notification.service.js";
import { AuthenticatedRequest } from "../types/index.js";
import logger from "../utils/logger.js";
import { getPaginationParams } from "../utils/helpers.js";
import {
  generateRecurrenceInstances,
  mergeTaskDeadlines,
} from "../services/calendar.service.js";
import { getIO } from "../socket/io.js";
import {
  CalendarEventType,
  RecurrenceFrequency,
  RSVPStatus,
} from "@prisma/client";

const isoDateSchema = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !Number.isNaN(date.getTime()), "Data inválida");

const optionalIsoDateSchema = z
  .string()
  .transform((val) => new Date(val))
  .refine((date) => !Number.isNaN(date.getTime()), "Data inválida")
  .optional();

function validateEventDates(
  data: {
    startTime?: Date;
    endTime?: Date;
    isRecurring?: boolean;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
  },
  ctx: z.RefinementCtx,
) {
  if (data.startTime && data.endTime && data.endTime < data.startTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A data final deve ser posterior ao início",
      path: ["endTime"],
    });
  }

  if (data.isRecurring) {
    if (!data.recurrenceFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione a frequência da recorrência",
        path: ["recurrenceFrequency"],
      });
    }

    if (data.recurrenceInterval !== undefined && data.recurrenceInterval < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O intervalo da recorrência deve ser de pelo menos 1",
        path: ["recurrenceInterval"],
      });
    }

    if (
      data.recurrenceEndDate &&
      data.startTime &&
      data.recurrenceEndDate < data.startTime
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A recorrência não pode terminar antes do evento começar",
        path: ["recurrenceEndDate"],
      });
    }
  }
}

const createEventSchema = z
  .object({
    title: z.string().min(1, "Título é obrigatório"),
    description: z.string().optional(),
    eventType: z.nativeEnum(CalendarEventType).default("CUSTOM"),
    startTime: isoDateSchema,
    endTime: isoDateSchema,
    isAllDay: z.boolean().default(false),
    location: z.string().optional(),
    color: z.string().optional(),
    channelId: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).optional(),
    recurrenceInterval: z.number().int().min(1).optional().default(1),
    recurrenceEndDate: optionalIsoDateSchema,
    participantIds: z.array(z.string()).optional(),
    reminderMinutes: z.array(z.number()).optional(),
  })
  .superRefine(validateEventDates);

const updateEventSchema = z
  .object({
    title: z.string().min(1, "Título é obrigatório").optional(),
    description: z.string().optional(),
    eventType: z.nativeEnum(CalendarEventType).optional(),
    startTime: optionalIsoDateSchema,
    endTime: optionalIsoDateSchema,
    isAllDay: z.boolean().optional(),
    location: z.string().optional(),
    color: z.string().optional(),
    channelId: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceFrequency: z.nativeEnum(RecurrenceFrequency).optional(),
    recurrenceInterval: z.number().int().min(1).optional(),
    recurrenceEndDate: optionalIsoDateSchema,
    participantIds: z.array(z.string()).optional(),
    reminderMinutes: z.array(z.number()).optional(),
  })
  .superRefine(validateEventDates);

const respondToEventSchema = z.object({
  status: z.nativeEnum(RSVPStatus),
});

export async function getEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, channelId, eventType } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "startDate e endDate são obrigatórios",
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get user's channel IDs
    const userChannels = await prisma.channelMember.findMany({
      where: { userId },
      select: { channelId: true },
    });
    const userChannelIds = userChannels.map((m) => m.channelId);

    const where: any = {
      AND: [
        {
          OR: [
            { createdById: userId },
            { participants: { some: { userId } } },
            { channelId: { in: userChannelIds } },
          ],
        },
        {
          OR: [
            // Non-recurring events in range
            {
              isRecurring: false,
              startTime: { lte: end },
              endTime: { gte: start },
            },
            // Recurring events that could have instances in range
            {
              isRecurring: true,
              startTime: { lte: end },
            },
          ],
        },
      ],
    };

    if (channelId) {
      where.channelId = channelId as string;
    }

    if (eventType) {
      where.eventType = eventType as string;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        channel: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Generate recurrence instances for recurring events
    let allEvents: any[] = [];

    for (const event of events) {
      allEvents.push({ ...event, isVirtual: false });

      if (event.isRecurring) {
        const instances = generateRecurrenceInstances(event as any, start, end);
        allEvents.push(...instances);
      }
    }

    // Merge task deadlines
    const taskDeadlines = await mergeTaskDeadlines(userId, start, end);
    allEvents.push(...taskDeadlines);

    // Sort by startTime
    allEvents.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    res.json({
      success: true,
      data: allEvents,
    });
  } catch (error) {
    logger.error("Get calendar events error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        channel: {
          select: { id: true, name: true },
        },
        taskCard: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Evento não encontrado",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error("Get calendar event error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function createEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createEventSchema.parse(req.body);
    const userId = req.user!.id;
    if (!req.tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant não resolvido' });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        tenantId: req.tenantId,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay,
        location: data.location,
        color: data.color,
        channelId: data.channelId,
        isRecurring: data.isRecurring,
        recurrenceFrequency: data.recurrenceFrequency,
        recurrenceInterval: data.recurrenceInterval,
        recurrenceEndDate: data.recurrenceEndDate,
        createdById: userId,
        participants:
          data.participantIds && data.participantIds.length > 0
            ? {
                create: data.participantIds.map((id) => ({
                  userId: id,
                })),
              }
            : undefined,
        reminders:
          data.reminderMinutes && data.reminderMinutes.length > 0
            ? {
                create: data.reminderMinutes.map((minutes) => ({
                  minutesBefore: minutes,
                  type: "in_app",
                })),
              }
            : undefined,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reminders: true,
      },
    });

    // Notify participants
    if (data.participantIds && data.participantIds.length > 0) {
      for (const participantId of data.participantIds) {
        await createNotification({
          userId: participantId,
          type: "calendar_invite",
          title: "Convite de Evento",
          message: `Você foi convidado para o evento: ${data.title}`,
          data: {
            eventId: event.id,
            eventTitle: data.title,
          },
        });
      }
    }

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "CALENDAR_EVENT_CREATED",
        entityType: "CALENDAR_EVENT",
        entityId: event.id,
        metadata: { title: data.title, eventType: data.eventType },
      },
      req,
    );

    try {
      const io = getIO();
      io.emit("calendar:created", { event });
    } catch {}

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    logger.error("Create calendar event error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const data = updateEventSchema.parse(req.body);
    const userId = req.user!.id;

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });

    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: "Evento não encontrado",
      });
    }

    // Verify creator or admin
    if (existingEvent.createdById !== userId && req.user!.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Sem permissão para editar este evento",
      });
    }

    const { participantIds, reminderMinutes, ...rawUpdateData } = data;
    const updateData: any = { ...rawUpdateData };
    const nextStartTime = data.startTime ?? existingEvent.startTime;
    const nextEndTime = data.endTime ?? existingEvent.endTime;
    const nextIsRecurring = data.isRecurring ?? existingEvent.isRecurring;
    const nextRecurrenceFrequency =
      data.recurrenceFrequency ?? existingEvent.recurrenceFrequency;
    const nextRecurrenceEndDate =
      data.recurrenceEndDate ?? existingEvent.recurrenceEndDate;

    if (nextEndTime < nextStartTime) {
      return res.status(400).json({
        success: false,
        error: "A data final deve ser posterior ao início",
      });
    }

    if (nextIsRecurring && !nextRecurrenceFrequency) {
      return res.status(400).json({
        success: false,
        error: "Selecione a frequência da recorrência",
      });
    }

    if (nextRecurrenceEndDate && nextRecurrenceEndDate < nextStartTime) {
      return res.status(400).json({
        success: false,
        error: "A recorrência não pode terminar antes do evento começar",
      });
    }

    if (data.isRecurring === false) {
      updateData.recurrenceFrequency = null;
      updateData.recurrenceInterval = null;
      updateData.recurrenceEndDate = null;
    }

    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reminders: true,
      },
    });

    // Sync participants if changed
    if (participantIds !== undefined) {
      // Remove existing participants
      await prisma.calendarEventParticipant.deleteMany({
        where: { eventId },
      });

      // Add new participants
      if (participantIds.length > 0) {
        await prisma.calendarEventParticipant.createMany({
          data: participantIds.map((id) => ({
            eventId,
            userId: id,
          })),
        });
      }
    }

    // Sync reminders if changed
    if (reminderMinutes !== undefined) {
      await prisma.calendarEventReminder.deleteMany({
        where: { eventId },
      });

      if (reminderMinutes.length > 0) {
        await prisma.calendarEventReminder.createMany({
          data: reminderMinutes.map((minutes) => ({
            eventId,
            minutesBefore: minutes,
            type: "in_app",
          })),
        });
      }
    }

    // Notify participants of changes
    const currentParticipantIds =
      participantIds || existingEvent.participants.map((p) => p.userId);
    for (const participantId of currentParticipantIds) {
      if (participantId !== userId) {
        await createNotification({
          userId: participantId,
          type: "calendar_updated",
          title: "Evento Atualizado",
          message: `O evento ${event.title} foi atualizado`,
          data: {
            eventId: event.id,
            eventTitle: event.title,
          },
        });
      }
    }

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "CALENDAR_EVENT_UPDATED",
        entityType: "CALENDAR_EVENT",
        entityId: eventId,
        metadata: { title: event.title },
      },
      req,
    );

    try {
      const io = getIO();
      io.emit("calendar:updated", { event });
    } catch {}

    // Re-fetch with all relations after sync
    const updatedEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        reminders: true,
      },
    });

    res.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    logger.error("Update calendar event error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const userId = req.user!.id;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        participants: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Evento não encontrado",
      });
    }

    // Verify creator or admin
    if (event.createdById !== userId && req.user!.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Sem permissão para excluir este evento",
      });
    }

    // Notify participants before deletion
    for (const participant of event.participants) {
      if (participant.userId !== userId) {
        await createNotification({
          userId: participant.userId,
          type: "calendar_cancelled",
          title: "Evento Cancelado",
          message: `O evento ${event.title} foi cancelado`,
          data: {
            eventId: event.id,
            eventTitle: event.title,
          },
        });
      }
    }

    // Delete event (cascade removes participants and reminders)
    await prisma.calendarEvent.delete({
      where: { id: eventId },
    });

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "CALENDAR_EVENT_DELETED",
        entityType: "CALENDAR_EVENT",
        entityId: eventId,
        metadata: { title: event.title },
      },
      req,
    );

    try {
      const io = getIO();
      io.emit("calendar:deleted", { eventId });
    } catch {}

    res.json({
      success: true,
      message: "Evento excluído com sucesso",
    });
  } catch (error) {
    logger.error("Delete calendar event error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function respondToEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const { eventId } = req.params;
    const { status } = respondToEventSchema.parse(req.body);
    const userId = req.user!.id;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        createdById: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Evento não encontrado",
      });
    }

    const participant = await prisma.calendarEventParticipant.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      create: {
        eventId,
        userId,
        status,
        respondedAt: new Date(),
      },
      update: {
        status,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify event creator
    if (event.createdById !== userId) {
      await createNotification({
        userId: event.createdById,
        type: "calendar_rsvp",
        title: "Resposta ao Evento",
        message: `${req.user!.displayName} respondeu ao evento: ${event.title}`,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          status,
          respondedBy: req.user!.displayName,
        },
      });
    }

    try {
      const io = getIO();
      io.emit("calendar:rsvp", {
        eventId,
        participant,
      });
    } catch {}

    res.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    logger.error("Respond to calendar event error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getUpcoming(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string) || 5),
    );

    const now = new Date();

    const events = await prisma.calendarEvent.findMany({
      where: {
        OR: [{ createdById: userId }, { participants: { some: { userId } } }],
        startTime: { gte: now },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    logger.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
