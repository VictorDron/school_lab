import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { randomInt } from 'crypto';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';
import { UserRole } from '@prisma/client';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

export function generateCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

export function generateInviteToken(): string {
  return nanoid(32);
}

export function generateApplicationToken(): string {
  return nanoid(24);
}

export function generatePasswordResetToken(): string {
  return nanoid(48);
}

export function sanitizeUser(user: any) {
  const { passwordHash, ...sanitized } = user;
  return sanitized;
}

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 25;

export function getPaginationParams(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function getDateRangeFilter(days?: number) {
  if (!days) return undefined;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    gte: startDate,
  };
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Gera uma senha temporária segura e aleatória
 * @param length Tamanho da senha (padrão: 12)
 * @returns Senha temporária
 */
export function generateTemporaryPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*-_+=';

  const allChars = lowercase + uppercase + numbers + symbols;

  // Garante pelo menos um de cada tipo
  const chars: string[] = [];
  chars.push(lowercase[randomInt(lowercase.length)]);
  chars.push(uppercase[randomInt(uppercase.length)]);
  chars.push(numbers[randomInt(numbers.length)]);
  chars.push(symbols[randomInt(symbols.length)]);

  // Preenche o restante aleatoriamente
  for (let i = chars.length; i < length; i++) {
    chars.push(allChars[randomInt(allChars.length)]);
  }

  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
