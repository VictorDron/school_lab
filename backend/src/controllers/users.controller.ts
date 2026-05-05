import { Response } from "express";
import { z } from "zod";
import { prisma } from "../config/database.js";
import { uploadFile } from "../config/supabase.js";
import {
  sanitizeUser,
  getPaginationParams,
  generateTemporaryPassword,
  hashPassword,
} from "../utils/helpers.js";
import { createAuditLog } from "../services/audit.service.js";
import { createNotification } from "../services/notification.service.js";
import {
  sendWelcomeEmail,
  sendPasswordResetCredentialsEmail,
} from "../services/email.service.js";
import { config } from "../config/index.js";
import { AuthenticatedRequest } from "../types/index.js";
import { UserRole, UserStatus, AccessLevel, AppModule } from "@prisma/client";
import logger from "../utils/logger.js";

const createUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2),
  fullName: z.string().min(2),
  role: z.nativeEnum(UserRole),
  area: z.string().optional().nullable(),
  status: z.nativeEnum(UserStatus).optional(),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Senha deve ter no mínimo 6 caracteres",
    }),
  moduleAccess: z
    .array(
      z.object({
        module: z.nativeEnum(AppModule),
        accessLevel: z.nativeEnum(AccessLevel),
      }),
    )
    .optional(),
  sendWelcomeEmail: z.boolean().optional(),
});

const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  fullName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  area: z.string().optional().nullable(),
  status: z.nativeEnum(UserStatus).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  moduleAccess: z
    .array(
      z.object({
        module: z.nativeEnum(AppModule),
        accessLevel: z.nativeEnum(AccessLevel),
      }),
    )
    .optional(),
});

const userDirectoryQuerySchema = z.object({
  search: z.string().trim().optional(),
  channelId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(25).default(10),
});

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado no sistema",
      });
    }

    // Gera ou usa senha fornecida
    const passwordWasGenerated = !data.password;
    const temporaryPassword = data.password || generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        displayName: data.displayName,
        fullName: data.fullName,
        role: data.role,
        area: data.area,
        status: data.status || "ACTIVE", // Default ACTIVE para criação direta
        passwordHash,
        emailVerified: true, // Marcado como verificado pois foi criado pelo admin
        requirePasswordChange: true, // Força troca de senha no primeiro login
      },
      include: { moduleAccess: true },
    });

    // Cria acessos aos módulos se fornecidos
    if (data.moduleAccess && data.moduleAccess.length > 0) {
      await prisma.moduleAccess.createMany({
        data: data.moduleAccess.map((ma) => ({
          userId: user.id,
          module: ma.module,
          accessLevel: ma.accessLevel,
        })),
      });
    }

    // Busca informações do sistema para o email
    const systemSettings = await prisma.systemSettings.findFirst();
    const schoolName = systemSettings?.schoolName || "School Lab";
    const loginUrl = config.frontendUrl || "http://localhost:5173";

    // Envia email de boas-vindas se solicitado
    if (data.sendWelcomeEmail !== false) {
      const welcomeResult = await sendWelcomeEmail({
        to: user.email,
        userName: user.displayName,
        email: user.email,
        temporaryPassword,
        loginUrl,
        schoolName,
      });
      if (!welcomeResult.success) {
        logger.error(`Failed to send welcome email to ${user.email}`);
      }
    }

    // Cria notificação in-app
    await createNotification({
      userId: user.id,
      type: "account_created",
      title: "Conta Criada",
      message: `Sua conta foi criada com sucesso no sistema ${schoolName}. ${data.sendWelcomeEmail !== false ? "Verifique seu email para acessar suas credenciais." : ""}`,
      sendEmail: false, // Já enviamos o email de boas-vindas
    });

    // Registra auditoria
    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          status: user.status,
          createdDirectly: true,
        },
      },
      req,
    );

    // Busca usuário atualizado com moduleAccess
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { moduleAccess: true },
    });

    // Se a senha foi gerada automaticamente E o email não foi enviado,
    // retorna a senha para o admin comunicar manualmente ao usuário
    const shouldReturnPassword =
      passwordWasGenerated && data.sendWelcomeEmail === false;

    res.status(201).json({
      success: true,
      data: sanitizeUser(finalUser),
      message: "Usuário criado com sucesso",
      ...(shouldReturnPassword && { temporaryPassword }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    logger.error("Create user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { status, role, search } = req.query;

    const where: any = {};

    if (status) {
      where.status = status as UserStatus;
    }

    if (role) {
      where.role = role as UserRole;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: "insensitive" } },
        { displayName: { contains: search as string, mode: "insensitive" } },
        { fullName: { contains: search as string, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { moduleAccess: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users.map(sanitizeUser),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getUserDirectory(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { search, channelId, limit } = userDirectoryQuerySchema.parse(
      req.query,
    );

    if (channelId) {
      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
          OR: [
            { type: "PUBLIC" },
            { members: { some: { userId: req.user!.id } } },
          ],
        },
        select: { id: true },
      });

      if (!channel) {
        return res.status(403).json({
          success: false,
          error: "Sem acesso ao canal solicitado",
        });
      }
    }

    const where: any = {
      status: "ACTIVE",
      ...(channelId && {
        channelMemberships: {
          some: { channelId },
        },
      }),
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
      orderBy: [{ displayName: "asc" }, { email: "asc" }],
      take: limit,
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Parâmetros inválidos",
        details: error.errors,
      });
    }

    logger.error("Get user directory error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { moduleAccess: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    logger.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id },
      include: { moduleAccess: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    const previousStatus = user.status;
    const previousRole = user.role;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        displayName: data.displayName,
        fullName: data.fullName,
        role: data.role,
        area: data.area,
        status: data.status,
        emailNotificationsEnabled: data.emailNotificationsEnabled,
      },
      include: { moduleAccess: true },
    });

    // Update module access if provided
    if (data.moduleAccess) {
      // Delete existing access
      await prisma.moduleAccess.deleteMany({
        where: { userId: id },
      });

      // Create new access entries
      await prisma.moduleAccess.createMany({
        data: data.moduleAccess.map((ma) => ({
          userId: id,
          module: ma.module,
          accessLevel: ma.accessLevel,
        })),
      });
    }

    // Notify user if activated
    if (previousStatus === "PENDING" && data.status === "ACTIVE") {
      await createNotification({
        userId: id,
        type: "account_activated",
        title: "Conta Ativada",
        message: "Sua conta foi aprovada e ativada. Bem-vindo ao School Lab!",
        sendEmail: true,
      });
    }

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action:
          previousStatus === "PENDING" && data.status === "ACTIVE"
            ? "USER_ACTIVATED"
            : "USER_UPDATED",
        entityType: "USER",
        entityId: id,
        metadata: {
          previousStatus,
          newStatus: data.status,
          previousRole,
          newRole: data.role,
        },
      },
      req,
    );

    // Fetch updated user with new module access
    const finalUser = await prisma.user.findUnique({
      where: { id },
      include: { moduleAccess: true },
    });

    res.json({
      success: true,
      data: sanitizeUser(finalUser),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    logger.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function archiveUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: "Você não pode arquivar sua própria conta",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    await prisma.user.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: "USER_ARCHIVED",
        entityType: "USER",
        entityId: id,
      },
      req,
    );

    res.json({
      success: true,
      message: "Usuário arquivado com sucesso",
    });
  } catch (error) {
    logger.error("Archive user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: "Você não pode excluir sua própria conta",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        createdTickets: true,
        assignedTickets: true,
        createdPurchases: true,
        createdAssets: true,
        responsibleAssets: true,
        createdLeads: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user has critical related data
    const hasCriticalData =
      user.createdTickets.length > 0 ||
      user.assignedTickets.length > 0 ||
      user.createdPurchases.length > 0 ||
      user.createdAssets.length > 0 ||
      user.responsibleAssets.length > 0 ||
      user.createdLeads.length > 0;

    if (hasCriticalData) {
      return res.status(400).json({
        success: false,
        error:
          "Não é possível excluir este usuário pois ele possui dados relacionados no sistema. Considere arquivar ao invés de excluir.",
        code: "HAS_RELATED_DATA",
      });
    }

    // Create audit log before deletion
    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: "USER_DELETED",
        entityType: "USER",
        entityId: id,
        metadata: {
          deletedUser: {
            email: user.email,
            displayName: user.displayName,
            role: user.role,
          },
        },
      },
      req,
    );

    // Delete related records that can be safely removed
    await prisma.$transaction([
      prisma.moduleAccess.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.messageRead.deleteMany({ where: { userId: id } }),
      prisma.channelMember.deleteMany({ where: { userId: id } }),
      prisma.invite.deleteMany({ where: { invitedBy: id } }),
      // Delete the user
      prisma.user.delete({ where: { id } }),
    ]);

    res.json({
      success: true,
      message: "Usuário excluído permanentemente com sucesso",
    });
  } catch (error) {
    logger.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const { displayName, fullName } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        displayName,
        fullName,
      },
      include: { moduleAccess: true },
    });

    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: "PROFILE_UPDATED",
        entityType: "USER",
        entityId: req.user!.id,
      },
      req,
    );

    res.json({
      success: true,
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Nenhum arquivo enviado",
      });
    }

    const path = `avatars/${req.user!.id}/${Date.now()}-${req.file.originalname}`;
    const avatarUrl = await uploadFile(
      req.file.buffer,
      path,
      req.file.mimetype,
    );

    if (!avatarUrl) {
      return res.status(500).json({
        success: false,
        error: "Falha ao fazer upload do avatar",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl },
      include: { moduleAccess: true },
    });

    res.json({
      success: true,
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    logger.error("Update avatar error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getPendingUsers(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const users = await prisma.user.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: users.map(sanitizeUser),
    });
  } catch (error) {
    logger.error("Get pending users error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function resetUserPassword(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    // Não permite resetar a própria senha por esta rota
    if (id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error:
          "Você não pode resetar sua própria senha por esta funcionalidade. Use a opção de alterar senha.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Gera nova senha temporária
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    // Atualiza usuário com nova senha e marca para trocar no próximo login
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        requirePasswordChange: true,
      },
    });

    // Busca informações para o email
    const systemSettings = await prisma.systemSettings.findFirst();
    const loginUrl = config.frontendUrl || "http://localhost:5173";

    // Envia email com as novas credenciais
    const resetResult = await sendPasswordResetCredentialsEmail({
      to: user.email,
      userName: user.displayName,
      email: user.email,
      temporaryPassword,
      loginUrl,
      resetByAdmin: req.user!.displayName || req.user!.email,
    });

    if (!resetResult.success) {
      logger.error(
        `Failed to send password reset credentials email to ${user.email}`,
      );
    }

    // Registra auditoria
    await createAuditLog(
      {
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        action: "PASSWORD_RESET",
        entityType: "USER",
        entityId: id,
        metadata: {
          targetEmail: user.email,
          resetByAdmin: true,
        },
      },
      req,
    );

    // Cria notificação in-app para o usuário
    await createNotification({
      userId: id,
      type: "security",
      title: "Senha Redefinida",
      message: `Sua senha foi redefinida pelo administrador ${req.user!.displayName || req.user!.email}. Verifique seu email para acessar as novas credenciais.`,
      sendEmail: false, // Já enviamos o email específico
    });

    res.json({
      success: true,
      message:
        "Senha resetada com sucesso. O usuário receberá um email com as novas credenciais.",
    });
  } catch (error) {
    logger.error("Reset user password error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
