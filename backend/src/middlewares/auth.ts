import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { AuthenticatedRequest, JwtPayload, AuthUser } from '../types/index.js';
import { AccessLevel, AppModule, UserRole } from '@prisma/client';
import logger from '../utils/logger.js';
import { runWithTenant } from '../lib/tenant-context.js';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        moduleAccess: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'Conta inativa ou pendente de aprovação',
      });
    }

    // Tenant integrity: the token's tenantId must match the user's current
    // tenantId. Stops a copied/replayed token from a moved/reassigned user
    // from carrying its old tenant context. Platform admins bypass this
    // check — they intentionally cross-tenant.
    if (!user.isPlatformAdmin && decoded.tenantId !== user.tenantId) {
      logger.warn('Auth: token tenantId mismatch', {
        userId: user.id,
        tokenTenantId: decoded.tenantId,
        userTenantId: user.tenantId,
      });
      return res.status(401).json({
        success: false,
        error: 'Token inválido (tenant mismatch)',
      });
    }

    const authReq = req as AuthenticatedRequest;
    authReq.tenantId = user.tenantId;
    authReq.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      isPlatformAdmin: user.isPlatformAdmin,
      moduleAccess: user.moduleAccess.map((ma) => ({
        module: ma.module,
        accessLevel: ma.accessLevel,
      })),
    };

    // Establish AsyncLocalStorage context so every Prisma query fired
    // inside this request — including async deep stacks — auto-scopes
    // by tenant via the middleware in config/database.ts. Platform admins
    // intentionally omit context (they cross-tenant by design).
    if (user.isPlatformAdmin) {
      next();
    } else {
      runWithTenant(user.tenantId, () => next());
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }

    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
    });
  }
}

/**
 * Phase 3b: gate platform-admin endpoints. Must be used AFTER
 * authenticate(). Only users with isPlatformAdmin = true can pass.
 * Cross-tenant ops (creating tenants, listing all tenants, etc.) live
 * behind this gate.
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const u = (req as AuthenticatedRequest).user;
  if (!u) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }
  if (!u.isPlatformAdmin) {
    return res.status(403).json({ success: false, error: 'Acesso restrito a platform admins' });
  }
  return next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - permissão insuficiente',
      });
    }

    next();
  };
}

export function requireModuleAccess(module: AppModule, minLevel: AccessLevel = 'VIEW') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    // Admin always has access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const accessLevels: AccessLevel[] = ['NONE', 'VIEW', 'EDIT', 'ADMIN'];
    const moduleAccess = req.user.moduleAccess.find((ma) => ma.module === module);
    
    if (!moduleAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso ao módulo não configurado',
      });
    }

    const userLevelIndex = accessLevels.indexOf(moduleAccess.accessLevel);
    const requiredLevelIndex = accessLevels.indexOf(minLevel);

    if (userLevelIndex < requiredLevelIndex) {
      return res.status(403).json({
        success: false,
        error: 'Nível de acesso insuficiente',
      });
    }

    next();
  };
}

/**
 * Grants access if the user has at least `minLevel` on ANY of the listed
 * modules. Used when a route is in the middle of migrating from one module
 * to another and must temporarily be reachable from either authorization
 * boundary (dual-permit). Prefer `requireModuleAccess` for the steady state.
 */
export function requireAnyModuleAccess(modules: AppModule[], minLevel: AccessLevel = 'VIEW') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado',
      });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const accessLevels: AccessLevel[] = ['NONE', 'VIEW', 'EDIT', 'ADMIN'];
    const requiredLevelIndex = accessLevels.indexOf(minLevel);

    const granted = modules.some((module) => {
      const ma = req.user!.moduleAccess.find((m) => m.module === module);
      if (!ma) return false;
      return accessLevels.indexOf(ma.accessLevel) >= requiredLevelIndex;
    });

    if (!granted) {
      return res.status(403).json({
        success: false,
        error: 'Acesso ao módulo não configurado',
      });
    }

    next();
  };
}

export function hasModuleAccess(user: AuthUser, module: AppModule, minLevel: AccessLevel = 'VIEW'): boolean {
  if (user.role === 'ADMIN') return true;
  
  const accessLevels: AccessLevel[] = ['NONE', 'VIEW', 'EDIT', 'ADMIN'];
  const moduleAccess = user.moduleAccess.find((ma) => ma.module === module);
  
  if (!moduleAccess) return false;

  const userLevelIndex = accessLevels.indexOf(moduleAccess.accessLevel);
  const requiredLevelIndex = accessLevels.indexOf(minLevel);

  return userLevelIndex >= requiredLevelIndex;
}
