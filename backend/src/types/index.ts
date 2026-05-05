import { Request } from 'express';
import { User, UserRole, AccessLevel, AppModule } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: UserRole;
  status: string;
  moduleAccess: ModuleAccessItem[];
}

export interface ModuleAccessItem {
  module: AppModule;
  accessLevel: AccessLevel;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export interface SocketUser {
  id: string;
  email: string;
  displayName: string;
  socketId: string;
}
