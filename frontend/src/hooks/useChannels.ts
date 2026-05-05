import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post } from '@/lib/api';
import type { Channel, ChannelMember } from '@/types/communication';

export function useChannels() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => get<Channel[]>('/channels'),
    select: (data) => data.data || [],
  });
}

export function useDirectMessages() {
  return useQuery({
    queryKey: ['directMessages'],
    queryFn: () => get<any[]>('/channels/dm'),
    select: (data) => data.data || [],
  });
}

export function useChannelMembers(channelId: string | null) {
  return useQuery({
    queryKey: ['channelMembers', channelId],
    queryFn: () => get<ChannelMember[]>(`/channels/${channelId}/members`),
    enabled: !!channelId,
    select: (data) => data.data || [],
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; type?: string; memberIds?: string[] }) =>
      post('/channels', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useCreateDirectMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => post('/channels/dm', { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
      qc.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

export function useJoinChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => post(`/channels/${channelId}/join`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}

export function useLeaveChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => post(`/channels/${channelId}/leave`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['channels'] });
    },
  });
}
