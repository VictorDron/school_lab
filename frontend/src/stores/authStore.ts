import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export type UserRole =
  | 'ADMIN' | 'MANAGER' | 'STAFF' | 'COORDINATOR' | 'TEACHER'
  | 'SECRETARY' | 'IT' | 'MAINTENANCE' | 'CLEANING' | 'PURCHASING'
  | 'FINANCE' | 'ADMISSIONS' | 'PSYCHOLOGY' | 'HEALTH' | 'LEGAL' | 'DIRECTOR';

export type AccessLevel = 'NONE' | 'VIEW' | 'EDIT' | 'ADMIN';

export type AppModule = 'COMMUNICATION' | 'PROCUREMENT' | 'ASSETS' | 'CRM' | 'GED' | 'ADMIN' | 'STUDENT_MANAGEMENT';

export interface ModuleAccess {
  module: AppModule;
  accessLevel: AccessLevel;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  area?: string;
  status: 'ACTIVE' | 'PENDING' | 'ARCHIVED';
  requirePasswordChange?: boolean;
  /** Phase 4: cross-tenant ops (platform admin only). */
  isPlatformAdmin?: boolean;
  /** Phase 1: tenant the user belongs to (null only during onboarding). */
  tenantId?: string | null;
  moduleAccess: ModuleAccess[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  
  hasModuleAccess: (module: AppModule, minLevel?: AccessLevel) => boolean;
  isAdmin: () => boolean;
}

const accessLevelOrder: AccessLevel[] = ['NONE', 'VIEW', 'EDIT', 'ADMIN'];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Connect socket after login
          connectSocket();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Disconnect socket before logout
        disconnectSocket();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data, isAuthenticated: true });

          // Connect socket after auth check
          connectSocket();
        } catch {
          get().logout();
        }
      },

      hasModuleAccess: (module: AppModule, minLevel: AccessLevel = 'VIEW') => {
        const { user } = get();
        if (!user) return false;
        
        // Admin always has access
        if (user.role === 'ADMIN') return true;
        
        const access = user.moduleAccess.find(a => a.module === module);
        if (!access) return false;
        
        const userLevelIndex = accessLevelOrder.indexOf(access.accessLevel);
        const requiredLevelIndex = accessLevelOrder.indexOf(minLevel);
        
        return userLevelIndex >= requiredLevelIndex;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'ADMIN';
      },
    }),
    {
      name: 'school-lab-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
