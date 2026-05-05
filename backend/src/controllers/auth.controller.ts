import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { hashPassword, comparePassword, generateToken, generateInviteToken, generatePasswordResetToken, sanitizeUser } from '../utils/helpers.js';
import { createAuditLog } from '../services/audit.service.js';
import { sendInviteEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { config } from '../config/index.js';
import logger from '../utils/logger.js';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

const registerSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  fullName: z.string().min(2, 'Nome completo obrigatório'),
  displayName: z.string().min(2, 'Nome de exibição obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  dateOfBirth: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token obrigatório'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { moduleAccess: true },
    });

    if (!user || !user.passwordHash) {
      await createAuditLog({
        actorEmail: email,
        action: 'LOGIN_FAILURE',
        metadata: { reason: 'Invalid credentials' },
      }, req);

      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await createAuditLog({
        actorId: user.id,
        actorEmail: email,
        action: 'LOGIN_FAILURE',
        metadata: { reason: 'Wrong password' },
      }, req);

      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas',
      });
    }

    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        error: 'Conta aguardando aprovação',
        code: 'PENDING_APPROVAL',
      });
    }

    if (user.status === 'ARCHIVED') {
      return res.status(403).json({
        success: false,
        error: 'Conta desativada',
        code: 'ACCOUNT_ARCHIVED',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LOGIN_SUCCESS',
    }, req);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body);

    // Validate invite token
    const invite = await prisma.invite.findUnique({
      where: { token: data.token },
    });

    if (!invite) {
      return res.status(400).json({
        success: false,
        error: 'Token de convite inválido',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        error: 'Este convite já foi utilizado',
      });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Convite expirado',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email já cadastrado',
      });
    }

    // Create user with role from invite
    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: invite.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName,
        displayName: data.displayName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        role: invite.role,
        status: 'PENDING',
      },
    });

    // Mark invite as used
    await prisma.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { inviteToken: data.token },
    }, req);

    res.status(201).json({
      success: true,
      message: 'Conta criada com sucesso. Aguarde aprovação do administrador.',
      data: {
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function validateToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Token inválido',
      });
    }

    if (invite.usedAt) {
      return res.status(400).json({
        success: false,
        error: 'Token já utilizado',
      });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Token expirado',
      });
    }

    res.json({
      success: true,
      data: {
        email: invite.email,
        name: invite.name,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    logger.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { moduleAccess: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    res.json({
      success: true,
      data: sanitizeUser(user),
    });
  } catch (error) {
    logger.error('Me error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'LOGOUT',
    }, req);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function createInvite(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, name, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email obrigatório',
      });
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'MANAGER', 'STAFF', 'COORDINATOR', 'TEACHER', 'SECRETARY', 'IT', 'MAINTENANCE', 'CLEANING', 'PURCHASING', 'FINANCE', 'ADMISSIONS'];
    const inviteRole = role && validRoles.includes(role) ? role : 'STAFF';

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Este email já está cadastrado',
      });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: email.toLowerCase(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um convite pendente para este email',
      });
    }

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: inviteRole,
        token,
        invitedBy: req.user!.id,
        expiresAt,
      },
    });

    const inviteLink = `${config.frontendUrl}/register?token=${token}`;

    // Get system settings for school name
    const settings = await prisma.systemSettings.findFirst();
    const schoolName = settings?.schoolName || 'School Lab';

    // Send invite email
    const emailResult = await sendInviteEmail({
      to: email,
      inviterName: req.user!.displayName,
      inviteLink,
      schoolName,
    });

    if (!emailResult.success) {
      logger.error(`Failed to send invite email to ${email}`);
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'INVITE_SENT',
      entityType: 'INVITE',
      entityId: invite.id,
      metadata: { invitedEmail: email, role: inviteRole },
    }, req);

    res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
        },
        inviteLink,
      },
    });
  } catch (error) {
    logger.error('Create invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.passwordHash) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      await createAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        action: 'PASSWORD_CHANGE_FAILURE',
        metadata: { reason: 'Wrong current password' },
      }, req);

      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta',
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and clear requirePasswordChange flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        requirePasswordChange: false,
      },
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_CHANGED',
      metadata: { forcedChange: user.requirePasswordChange },
    }, req);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user || user.status === 'ARCHIVED') {
      return res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour expiration

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Build reset link
    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    const resetEmailResult = await sendPasswordResetEmail({
      to: user.email,
      resetLink,
      userName: user.displayName,
    });

    if (!resetEmailResult.success) {
      logger.error(`Failed to send password reset email to ${user.email}`);
    }

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_RESET',
      metadata: { method: 'email_request' },
    }, req);

    res.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function validateResetToken(req: Request, res: Response) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token obrigatório',
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado',
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    logger.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado',
      });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        requirePasswordChange: false,
      },
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'PASSWORD_CHANGED',
      metadata: { method: 'email_reset' },
    }, req);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso. Você já pode fazer login.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }

    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
}
