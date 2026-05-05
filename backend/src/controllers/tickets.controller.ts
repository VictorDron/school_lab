import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { generateCode, getPaginationParams } from '../utils/helpers.js';
import { createAuditLog } from '../services/audit.service.js';
import { createNotification } from '../services/notification.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { TicketStatus, TicketPriority, TicketDepartment } from '@prisma/client';
import logger from '../utils/logger.js';

const addCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo do comentário é obrigatório').max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number(),
  })).optional(),
  isInternal: z.boolean().default(false),
});

const createTicketSchema = z.object({
  title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  department: z.nativeEnum(TicketDepartment),
  priority: z.nativeEnum(TicketPriority).default('MEDIUM'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number(),
  })).optional(),
});

const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function getTickets(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, department, priority, assignedToMe, createdByMe, search } = req.query;

    const where: any = {};

    if (status) where.status = status as TicketStatus;
    if (department) where.department = department as TicketDepartment;
    if (priority) where.priority = priority as TicketPriority;
    if (assignedToMe === 'true') where.assigneeId = req.user!.id;
    if (createdByMe === 'true') where.createdById = req.user!.id;

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          creator: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
          assignee: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      success: true,
      data: tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function getTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, displayName: true, email: true, avatarUrl: true },
        },
        comments: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        activity: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado',
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    logger.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function createTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.create({
      data: {
        code: generateCode('TK'),
        title: data.title,
        description: data.description,
        department: data.department,
        priority: data.priority,
        attachments: data.attachments,
        createdById: req.user!.id,
      },
      include: {
        creator: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create activity log
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        action: 'CREATED',
        actorId: req.user!.id,
        details: { priority: data.priority, department: data.department },
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'TICKET_CREATED',
      entityType: 'TICKET',
      entityId: ticket.id,
      metadata: { code: ticket.code, department: data.department },
    }, req);

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function updateTicket(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateTicketSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado',
      });
    }

    const updateData: any = {};
    const activityDetails: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
      activityDetails.previousStatus = ticket.status;
      activityDetails.newStatus = data.status;

      if (data.status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }
      if (data.status === 'CLOSED') {
        updateData.closedAt = new Date();
      }
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
      activityDetails.previousPriority = ticket.priority;
      activityDetails.newPriority = data.priority;
    }

    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId;
      activityDetails.previousAssignee = ticket.assigneeId;
      activityDetails.newAssignee = data.assigneeId;

      // Notify new assignee
      if (data.assigneeId) {
        await createNotification({
          userId: data.assigneeId,
          type: 'ticket_assigned',
          title: 'Ticket Atribuído',
          message: `O ticket "${ticket.title}" foi atribuído a você.`,
          data: {
            ticketId: ticket.id,
            ticketCode: ticket.code,
            actionUrl: `/communication?tab=tickets&ticket=${ticket.id}`,
          },
          sendEmail: true,
        });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        assignee: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create activity
    const action = data.status ? 'STATUS_CHANGED' : data.assigneeId !== undefined ? 'ASSIGNED' : 'UPDATED';
    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        action,
        actorId: req.user!.id,
        details: activityDetails,
      },
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: data.assigneeId !== undefined ? 'TICKET_ASSIGNED' : 'TICKET_UPDATED',
      entityType: 'TICKET',
      entityId: id,
      metadata: activityDetails,
    }, req);

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Update ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = addCommentSchema.parse(req.body);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { creator: true, assignee: true },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket não encontrado',
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId: id,
        userId: req.user!.id,
        content: data.content,
        attachments: data.attachments,
        isInternal: data.isInternal,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Create activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: id,
        action: 'COMMENTED',
        actorId: req.user!.id,
        details: { commentId: comment.id },
      },
    });

    // Notify relevant users
    const usersToNotify = new Set<string>();
    if (ticket.createdById !== req.user!.id) {
      usersToNotify.add(ticket.createdById);
    }
    if (ticket.assigneeId && ticket.assigneeId !== req.user!.id) {
      usersToNotify.add(ticket.assigneeId);
    }

    for (const userId of usersToNotify) {
      await createNotification({
        userId,
        type: 'ticket_comment',
        title: 'Novo Comentário',
        message: `Novo comentário no ticket "${ticket.title}"`,
        data: {
          ticketId: ticket.id,
          ticketCode: ticket.code,
          actionUrl: `/communication?tab=tickets&ticket=${ticket.id}`,
        },
      });
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'TICKET_COMMENTED',
      entityType: 'TICKET',
      entityId: id,
    }, req);

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function getTicketStats(req: AuthenticatedRequest, res: Response) {
  try {
    const [open, inProgress, resolved, total] = await Promise.all([
      prisma.ticket.count({ where: { status: 'OPEN' } }),
      prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      prisma.ticket.count(),
    ]);

    const byDepartment = await prisma.ticket.groupBy({
      by: ['department'],
      _count: { id: true },
    });

    const byPriority = await prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        open,
        inProgress,
        resolved,
        total,
        byDepartment: byDepartment.map(d => ({
          department: d.department,
          count: d._count.id,
        })),
        byPriority: byPriority.map(p => ({
          priority: p.priority,
          count: p._count.id,
        })),
      },
    });
  } catch (error) {
    logger.error('Get ticket stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
