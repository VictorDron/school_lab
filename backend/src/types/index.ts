import { Request } from 'express';
import { User, UserRole, AccessLevel, AppModule } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  // Set by the auth middleware after token + user are validated. Always
  // present on routes that ran through `authenticate()`. Absent on public
  // (token-based) endpoints — those resolve tenant via entity lookup.
  tenantId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: UserRole;
  status: string;
  tenantId: string | null;
  isPlatformAdmin: boolean;
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
  // Tenant the token was issued for. Validated against user.tenantId on
  // every request — a token whose tenant disagrees with the user record
  // is rejected to defend against tampering / role copying across tenants.
  tenantId: string | null;
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
