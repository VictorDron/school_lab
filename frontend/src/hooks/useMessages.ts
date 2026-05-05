import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del, type ApiResponse } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { Message } from '@/types/communication';

const TEMP_ID_PREFIX = '__optimistic__';

export function useMessages(channelId: string | null, page = 1) {
  return useQuery({
    queryKey: ['messages', channelId, page],
    queryFn: () => get<Message[]>(`/channels/${channelId}/messages?page=${page}&limit=50`),
    enabled: !!channelId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, content, attachments }: { channelId: string; content: string; attachments?: any[] }) =>
      post<Message>(`/channels/${channelId}/messages`, { content, attachments }),
    onMutate: async (vars) => {
      const user = useAuthStore.getState().user;
      await qc.cancelQueries({ queryKey: ['messages', vars.channelId] });

      const previousData = qc.getQueriesData({ queryKey: ['messages', vars.channelId] });

      const optimisticMessage: Message = {
        id: `${TEMP_ID_PREFIX}${Date.now()}`,
        content: vars.content,
        channelId: vars.channelId,
        senderId: user?.id || '',
        sender: {
          id: user?.id || '',
          displayName: user?.displayName || '',
          avatarUrl: user?.avatarUrl,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isEdited: false,
        isDeleted: false,
        attachments: vars.attachments || null,
        reactions: [],
        reads: [],
        isPinned: false,
        messageType: 'TEXT',
        _count: { replies: 0 },
      } as unknown as Message;

      qc.setQueriesData<ApiResponse<Message[]>>(
        { queryKey: ['messages', vars.channelId] },
        (old) => {
          if (!old?.data) return old;
          return { ...old, data: [...old.data, optimisticMessage] };
        },
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          qc.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: (_, _err, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId, content }: { channelId: string; messageId: string; content: string }) =>
      patch(`/channels/${channelId}/messages/${messageId}`, { content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      del(`/channels/${channelId}/messages/${messageId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
    },
  });
}

export function usePinMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      post(`/channels/${channelId}/messages/${messageId}/pin`, {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
      qc.invalidateQueries({ queryKey: ['pinnedMessages', vars.channelId] });
    },
  });
}

export function useUnpinMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: string; messageId: string }) =>
      del(`/channels/${channelId}/messages/${messageId}/pin`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
      qc.invalidateQueries({ queryKey: ['pinnedMessages', vars.channelId] });
    },
  });
}

export function usePinnedMessages(channelId: string | null) {
  return useQuery({
    queryKey: ['pinnedMessages', channelId],
    queryFn: () => get<Message[]>(`/channels/${channelId}/messages/pinned`),
    enabled: !!channelId,
    select: (data) => data.data || [],
  });
}

export function useSearchMessages(channelId: string | null, query: string) {
  return useQuery({
    queryKey: ['searchMessages', channelId, query],
    queryFn: () => get<Message[]>(`/channels/${channelId}/messages/search?q=${encodeURIComponent(query)}`),
    enabled: !!channelId && query.length >= 2,
  });
}

export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId, emoji }: { channelId: string; messageId: string; emoji: string }) =>
      post(`/channels/${channelId}/messages/${messageId}/reactions`, { emoji }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
    },
  });
}

export function useRemoveReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId, emoji }: { channelId: string; messageId: string; emoji: string }) =>
      del(`/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
    },
  });
}

export function useThreadReplies(channelId: string, messageId: string | null) {
  return useQuery({
    queryKey: ['threadReplies', channelId, messageId],
    queryFn: () => get<Message[]>(`/channels/${channelId}/messages/${messageId}/replies`),
    enabled: !!messageId && !!channelId,
  });
}

export function useSendThreadReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId, content, attachments }: { channelId: string; messageId: string; content: string; attachments?: any[] }) =>
      post(`/channels/${channelId}/messages/${messageId}/replies`, { content, attachments }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['threadReplies', vars.channelId, vars.messageId] });
      qc.invalidateQueries({ queryKey: ['messages', vars.channelId] });
    },
  });
}
