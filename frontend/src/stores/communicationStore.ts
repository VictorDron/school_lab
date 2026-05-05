import { create } from 'zustand';

interface TypingUser {
  userId: string;
  displayName: string;
}

interface CommunicationState {
  // Active channel
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;

  // Thread panel
  threadMessageId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;

  // Panels
  showMembers: boolean;
  toggleMembers: () => void;
  showPinned: boolean;
  togglePinned: () => void;
  showSearch: boolean;
  toggleSearch: () => void;
  showDmProfile: boolean;
  toggleDmProfile: () => void;

  // Online users
  onlineUsers: Set<string>;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;

  // Typing users (per channel)
  typingUsers: Map<string, TypingUser>;
  addTypingUser: (channelId: string, userId: string, displayName: string) => void;
  removeTypingUser: (channelId: string, userId: string) => void;

  // Active board
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id, threadMessageId: null }),

  threadMessageId: null,
  openThread: (messageId) => set({ threadMessageId: messageId }),
  closeThread: () => set({ threadMessageId: null }),

  showMembers: false,
  toggleMembers: () => set((s) => ({ showMembers: !s.showMembers, showPinned: false, showSearch: false, showDmProfile: false })),
  showPinned: false,
  togglePinned: () => set((s) => ({ showPinned: !s.showPinned, showMembers: false, showSearch: false, showDmProfile: false })),
  showSearch: false,
  toggleSearch: () => set((s) => ({ showSearch: !s.showSearch, showMembers: false, showPinned: false, showDmProfile: false })),
  showDmProfile: false,
  toggleDmProfile: () => set((s) => ({ showDmProfile: !s.showDmProfile, showMembers: false, showPinned: false, showSearch: false })),

  onlineUsers: new Set(),
  setUserOnline: (userId) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),
  setUserOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),

  typingUsers: new Map(),
  addTypingUser: (channelId, userId, displayName) =>
    set((s) => {
      const key = `${channelId}:${userId}`;
      const next = new Map(s.typingUsers);
      next.set(key, { userId, displayName });
      return { typingUsers: next };
    }),
  removeTypingUser: (channelId, userId) =>
    set((s) => {
      const key = `${channelId}:${userId}`;
      const next = new Map(s.typingUsers);
      next.delete(key);
      return { typingUsers: next };
    }),

  activeBoardId: null,
  setActiveBoardId: (id) => set({ activeBoardId: id }),
}));
