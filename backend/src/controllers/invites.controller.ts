import { Response } from 'express';
import { prisma } from '../config/database.js';
import { generateInviteToken } from '../utils/helpers.js';
import { createAuditLog } from '../services/audit.service.js';
import { sendInviteEmail } from '../services/email.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

// List all invites with filtering
export async function listInvites(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, search } = req.query;

    const now = new Date();

    let whereClause: any = {};

    // Filter by status
    if (status === 'PENDING') {
      whereClause = {
        usedAt: null,
        expiresAt: { gt: now },
      };
    } else if (status === 'USED') {
      whereClause = {
        usedAt: { not: null },
      };
    } else if (status === 'EXPIRED') {
      whereClause = {
        usedAt: null,
        expiresAt: { lte: now },
      };
    }

    // Search by email or name
    if (search && typeof search === 'string') {
      whereClause = {
        ...whereClause,
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const invites = await prisma.invite.findMany({
      where: whereClause,
      include: {
        inviter: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add computed status to each invite
    const invitesWithStatus = invites.map((invite) => {
      let computedStatus = 'PENDING';
      if (invite.usedAt) {
        computedStatus = 'USED';
      } else if (new Date(invite.expiresAt) <= now) {
        computedStatus = 'EXPIRED';
      }

      return {
        ...invite,
        status: computedStatus,
      };
    });

    res.json({
      success: true,
      data: invitesWithStatus,
    });
  } catch (error) {
    logger.error('List invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

// Get single invite
export async function getInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { id },
      include: {
        inviter: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Convite não encontrado',
      });
    }

    const now = new Date();
    let status = 'PENDING';
    if (invite.usedAt) {
      status = 'USED';
    } else if (new Date(invite.expiresAt) <= now) {
      status = 'EXPIRED';
    }

    res.json({
      success: true,
      data: {
        ...invite,
        status,
      },
    });
  } catch (error) {
    logger.error('Get invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

// Update invite (only pending invites can be updated)
export async function updateInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const invite = await prisma.invite.findUnique({
      where: { id },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Convite não encontrado',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível editar um convite já utilizado',
      });
    }

    const now = new Date();
    if (new Date(invite.expiresAt) <= now) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível editar um convite expirado',
      });
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'MANAGER', 'STAFF', 'COORDINATOR', 'TEACHER', 'SECRETARY', 'IT', 'MAINTENANCE', 'CLEANING', 'PURCHASING', 'FINANCE', 'ADMISSIONS'];

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role && validRoles.includes(role)) updateData.role = role;

    const updatedInvite = await prisma.invite.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'INVITE_SENT',
      entityType: 'INVITE',
      entityId: id,
      metadata: { action: 'updated', changes: updateData },
    }, req);

    res.json({
      success: true,
      data: {
        ...updatedInvite,
        status: 'PENDING',
      },
    });
  } catch (error) {
    logger.error('Update invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

// Delete invite
export async function deleteInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { id },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Convite não encontrado',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir um convite já utilizado',
      });
    }

    await prisma.invite.delete({
      where: { id },
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'INVITE_SENT',
      entityType: 'INVITE',
      entityId: id,
      metadata: { action: 'deleted', email: invite.email },
    }, req);

    res.json({
      success: true,
      message: 'Convite excluído com sucesso',
    });
  } catch (error) {
    logger.error('Delete invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

// Resend invite (creates new token and extends expiration)
export async function resendInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { id },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Convite não encontrado',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível reenviar um convite já utilizado',
      });
    }

    // Generate new token and extend expiration
    const newToken = generateInviteToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days

    const updatedInvite = await prisma.invite.update({
      where: { id },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
      },
    });

    const inviteLink = `${config.frontendUrl}/register?token=${newToken}`;

    // Get system settings for school name
    const settings = await prisma.systemSettings.findFirst();
    const schoolName = settings?.schoolName || 'School Lab';

    // Send invite email
    const inviteEmailResult = await sendInviteEmail({
      to: invite.email,
      inviterName: req.user!.displayName,
      inviteLink,
      schoolName,
    });

    if (!inviteEmailResult.success) {
      logger.error(`Failed to send invite email to ${invite.email}`);
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'INVITE_SENT',
      entityType: 'INVITE',
      entityId: id,
      metadata: { action: 'resent', email: invite.email },
    }, req);

    res.json({
      success: true,
      data: {
        ...updatedInvite,
        status: 'PENDING',
      },
      inviteLink,
      message: 'Convite reenviado com sucesso',
    });
  } catch (error) {
    logger.error('Resend invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

// Get invite statistics
export async function getInviteStats(req: AuthenticatedRequest, res: Response) {
  try {
    const now = new Date();

    const [total, pending, used, expired] = await Promise.all([
      prisma.invite.count(),
      prisma.invite.count({
        where: {
          usedAt: null,
          expiresAt: { gt: now },
        },
      }),
      prisma.invite.count({
        where: {
          usedAt: { not: null },
        },
      }),
      prisma.invite.count({
        where: {
          usedAt: null,
          expiresAt: { lte: now },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        pending,
        used,
        expired,
      },
    });
  } catch (error) {
    logger.error('Get invite stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
