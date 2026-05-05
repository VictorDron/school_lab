// ==================== MESSAGING ====================

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: "PUBLIC" | "PRIVATE" | "DIRECT";
  createdBy: string;
  isArchived: boolean;
  unreadCount: number;
  isMember: boolean;
  _count?: { members: number; messages: number };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; displayName: string };
  };
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  isEdited: boolean;
  isDeleted: boolean;
  isPinned: boolean;
  pinnedById?: string;
  pinnedAt?: string;
  messageType: "TEXT" | "SYSTEM" | "TASK_REF";
  metadata?: Record<string, any>;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  pinnedBy?: { id: string; displayName: string };
  reactions: Reaction[];
  _count?: { replies: number };
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
  storagePath?: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user: { id: string; displayName: string };
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  isOwner: boolean;
  isAdmin: boolean;
  isMuted: boolean;
  isOnline: boolean;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
}

// ==================== TASK MANAGEMENT ====================

export interface TaskBoard {
  id: string;
  name: string;
  description?: string;
  channelId?: string;
  visibility: "CHANNEL" | "PRIVATE" | "PUBLIC";
  createdById: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  columns?: TaskColumn[];
  _count?: { columns: number; members: number };
  channel?: { id: string; name: string };
}

export interface TaskBoardMember {
  id: string;
  boardId: string;
  userId: string;
  isAdmin: boolean;
  user: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
}

export interface TaskColumn {
  id: string;
  boardId: string;
  name: string;
  color: string;
  order: number;
  limit?: number;
  cards?: TaskCard[];
  _count?: { cards: number };
}

export interface TaskCard {
  id: string;
  code: string;
  columnId: string;
  title: string;
  description?: string;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "OPEN" | "COMPLETED" | "ARCHIVED";
  order: number;
  dueDate?: string;
  completedAt?: string;
  attachments?: Attachment[];
  coverImage?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignees?: TaskAssignment[];
  labels?: TaskCardLabelRef[];
  checklists?: TaskChecklist[];
  comments?: TaskComment[];
  activity?: TaskActivity[];
  _count?: { comments: number; checklists: number };
  column?: { id: string; name: string; board?: { id: string; name: string } };
}

export interface TaskAssignment {
  id: string;
  cardId: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    email?: string;
  };
}

export interface TaskLabel {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface TaskCardLabelRef {
  id: string;
  cardId: string;
  labelId: string;
  label: TaskLabel;
}

export interface TaskChecklist {
  id: string;
  cardId: string;
  title: string;
  order: number;
  items: TaskChecklistItem[];
}

export interface TaskChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  isComplete: boolean;
  order: number;
  completedAt?: string;
}

export interface TaskComment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export interface TaskActivity {
  id: string;
  cardId: string;
  action: string;
  actorId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

// ==================== CALENDAR ====================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventType: "MEETING" | "DEADLINE" | "REMINDER" | "CUSTOM";
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location?: string;
  color?: string;
  channelId?: string;
  taskCardId?: string;
  createdById: string;
  isRecurring: boolean;
  recurrenceFrequency?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  createdAt: string;
  updatedAt: string;
  isVirtual?: boolean;
  creator?: { id: string; displayName: string; avatarUrl?: string };
  channel?: { id: string; name: string };
  taskCard?: { id: string; title: string; code: string };
  participants?: CalendarEventParticipant[];
}

export interface CalendarEventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
  respondedAt?: string;
  user: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
  };
}

// ==================== COMMON ====================

export type CalendarViewMode = "month" | "week" | "day";
