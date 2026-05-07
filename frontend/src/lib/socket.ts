import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

let socket: Socket | null = null;

// Store pending listeners to attach when socket connects
const pendingListeners: Map<string, Set<(data: unknown) => void>> = new Map();

// Store pending room joins to re-emit on connect/reconnect
const pendingRoomJoins: Set<{ event: string; args: unknown[] }> = new Set();

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().token;

  if (!token) {
    console.warn('No token available for socket connection');
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);

    // Attach any pending listeners
    pendingListeners.forEach((listeners, event) => {
      listeners.forEach((callback) => {
        socket?.on(event, callback);
      });
    });

    // Re-emit pending room joins (rooms are lost on reconnect)
    pendingRoomJoins.forEach(({ event, args }) => {
      socket?.emit(event, ...args);
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  pendingListeners.clear();
  pendingRoomJoins.clear();
  _leadJoins.clear();
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinChannel(channelId: string) {
  socket?.emit('channel:join', channelId);
}

export function leaveChannel(channelId: string) {
  socket?.emit('channel:leave', channelId);
}

export function startTyping(channelId: string) {
  socket?.emit('typing:start', channelId);
}

export function stopTyping(channelId: string) {
  socket?.emit('typing:stop', channelId);
}

// Helper to add listener that works even if socket not yet connected
export function addSocketListener(event: string, callback: (data: unknown) => void) {
  if (!pendingListeners.has(event)) {
    pendingListeners.set(event, new Set());
  }
  pendingListeners.get(event)!.add(callback);

  if (socket?.connected) {
    socket.on(event, callback);
  }

  return () => {
    pendingListeners.get(event)?.delete(callback);
    socket?.off(event, callback);
  };
}

// Hooks for real-time updates
export function onNewMessage(callback: (message: unknown) => void) {
  return addSocketListener('message:new', callback);
}

export function onNotification(callback: (notification: unknown) => void) {
  return addSocketListener('notification', callback);
}

export function onUserOnline(callback: (data: { userId: string }) => void) {
  return addSocketListener('user:online', callback as (data: unknown) => void);
}

export function onUserOffline(callback: (data: { userId: string }) => void) {
  return addSocketListener('user:offline', callback as (data: unknown) => void);
}

export function onTypingStart(callback: (data: { userId: string; displayName: string; channelId: string }) => void) {
  return addSocketListener('typing:start', callback as (data: unknown) => void);
}

export function onTypingStop(callback: (data: { userId: string; channelId: string }) => void) {
  return addSocketListener('typing:stop', callback as (data: unknown) => void);
}

// CRM real-time helpers (per D-04)
// Room joins are tracked so they re-emit on connect/reconnect

const _pipelineJoin = { event: 'crm:pipeline:join', args: [] as unknown[] };

export function joinCrmPipeline() {
  pendingRoomJoins.add(_pipelineJoin);
  socket?.emit('crm:pipeline:join');
}

export function leaveCrmPipeline() {
  pendingRoomJoins.delete(_pipelineJoin);
  socket?.emit('crm:pipeline:leave');
}

const _leadJoins = new Map<string, { event: string; args: unknown[] }>();

export function joinCrmLead(leadId: string) {
  const entry = { event: 'crm:lead:join', args: [leadId] };
  _leadJoins.set(leadId, entry);
  pendingRoomJoins.add(entry);
  socket?.emit('crm:lead:join', leadId);
}

export function leaveCrmLead(leadId: string) {
  const entry = _leadJoins.get(leadId);
  if (entry) {
    pendingRoomJoins.delete(entry);
    _leadJoins.delete(leadId);
  }
  socket?.emit('crm:lead:leave', leadId);
}

// CRM event listeners
export function onCrmLeadListUpdated(callback: (data: { type: string; leadId: string }) => void) {
  return addSocketListener('crm:lead:list-updated', callback as (data: unknown) => void);
}

export function onCrmLeadUpdated(callback: (data: { leadId: string }) => void) {
  return addSocketListener('crm:lead:updated', callback as (data: unknown) => void);
}

// Students real-time helpers (per D-14)
// Room joins are tracked so they re-emit on connect/reconnect
const _studentsListJoin = { event: 'students:list:join', args: [] as unknown[] };

export function joinStudentsList() {
  pendingRoomJoins.add(_studentsListJoin);
  socket?.emit('students:list:join');
}

export function leaveStudentsList() {
  pendingRoomJoins.delete(_studentsListJoin);
  socket?.emit('students:list:leave');
}

export function onStudentListUpdated(
  callback: (data: { type: string; studentId?: string; leadId?: string }) => void
) {
  return addSocketListener('students:list:updated', callback as (data: unknown) => void);
}
