export type Tab = 'users' | 'invites' | 'audit' | 'settings';
export type StatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'ARCHIVED';
export type InviteStatusFilter = 'ALL' | 'PENDING' | 'USED' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  role: string;
  area?: string;
  status: string;
  avatarUrl?: string;
  emailNotificationsEnabled?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Invite {
  id: string;
  email: string;
  name?: string;
  role: string;
  token: string;
  invitedBy: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
  status: 'PENDING' | 'USED' | 'EXPIRED';
  inviter?: { displayName: string; email: string };
}
