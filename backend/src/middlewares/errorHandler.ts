import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', error);

  // AppError (custom errors)
  if (error instanceof AppError) {
    const body: Record<string, unknown> = {
      success: false,
      error: error.message,
      code: error.code,
    };
    if (error.details) {
      body.details = error.details;
    }
    return res.status(error.statusCode).json(body);
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const messages = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    const fieldList = messages.map(m => `${m.field}: ${m.message}`).join('; ');

    return res.status(400).json({
      success: false,
      error: `Erro de validação: ${fieldList}`,
      code: 'VALIDATION_ERROR',
      details: messages,
    });
  }

  // Prisma connection errors (transient — Railway proxy drops idle connections)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P1017' || error.code === 'P1001' || error.code === 'P1002') {
      logger.warn(`Database connection error (${error.code}), client should retry`);
      return res.status(503).json({
        success: false,
        error: 'Serviço temporariamente indisponível. Tente novamente.',
        code: 'DB_CONNECTION_ERROR',
      });
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Registro já existe',
        code: 'DUPLICATE_ENTRY',
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        code: 'NOT_FOUND',
      });
    }
  }

  // Prisma initialization/connection errors
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error.message && error.message.includes('Server has closed the connection'))
  ) {
    logger.warn('Database connection lost, client should retry');
    return res.status(503).json({
      success: false,
      error: 'Serviço temporariamente indisponível. Tente novamente.',
      code: 'DB_CONNECTION_ERROR',
    });
  }

  // Generic server error
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    code: 'ROUTE_NOT_FOUND',
  });
}
