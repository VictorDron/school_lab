import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Hook to get count of unviewed leads with FORM_RECEIVED status
 */
export function useUnviewedLeadsCount() {
  return useQuery({
    queryKey: ['leads', 'unviewed-count'],
    queryFn: async () => {
      const response = await api.get('/leads/unviewed-count');
      return response.data.data.count as number;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

/**
 * Hook to mark a lead as viewed
 */
export function useMarkLeadViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const response = await api.post(`/leads/${leadId}/mark-viewed`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the unviewed count query
      queryClient.invalidateQueries({ queryKey: ['leads', 'unviewed-count'] });
    },
  });
}

/**
 * Hook to update application status
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, status }: { leadId: string; status: string }) => {
      const response = await api.patch(`/leads/${leadId}/application-status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

/**
 * Hook to mark all leads as viewed (clear notification badge)
 */
export function useMarkAllLeadsViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/leads/mark-all-viewed');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate the unviewed count query
      queryClient.invalidateQueries({ queryKey: ['leads', 'unviewed-count'] });
    },
  });
}
