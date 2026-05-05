import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';

interface SearchUser {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['userSearch', query],
    queryFn: () => get<SearchUser[]>(`/channels/users/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
    select: (data) => data.data || [],
    staleTime: 10000,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['userSearch', ''],
    queryFn: () => get<SearchUser[]>('/channels/users/search'),
    select: (data) => data.data || [],
    staleTime: 30000,
  });
}
