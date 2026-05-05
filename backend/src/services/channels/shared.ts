export const SENDER_SELECT = { id: true, displayName: true, avatarUrl: true } as const;
export const USER_DETAILS_SELECT = {
  id: true,
  displayName: true,
  email: true,
  avatarUrl: true,
  role: true,
} as const;
export const REACTIONS_INCLUDE = { user: { select: { id: true, displayName: true } } } as const;

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export interface CreateChannelData {
  name: string;
  description?: string;
  type?: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  memberIds?: string[];
}

export interface SendMessageData {
  content: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
    storagePath?: string;
  }[];
}
