import { useQuery, useQueryClient } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { DashboardStats } from '@/pages/modules/crm/dashboard/types';

// Get full dashboard statistics
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => get<DashboardStats>('/leads/stats/dashboard'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
  });
}

/**
 * Invalidates all queries related to a specific lead.
 * Call this after any mutation that changes lead data or its nested relations
 * (parents, children, address, documents, contracts, gates, etc.)
 * This prevents the "stale UI" problem where users need to refresh to see updates.
 */
export function invalidateLeadRelated(queryClient: ReturnType<typeof useQueryClient>, leadId: string) {
  queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
  queryClient.invalidateQueries({ queryKey: ['leads'] });
  queryClient.invalidateQueries({ queryKey: ['contracts', leadId] });
  queryClient.invalidateQueries({ queryKey: ['contract-prerequisites', leadId] });
  queryClient.invalidateQueries({ queryKey: ['gate-approvals', leadId] });
  queryClient.invalidateQueries({ queryKey: ['pipeline-status', leadId] });
  queryClient.invalidateQueries({ queryKey: ['evaluations', 'lead', leadId] });
  queryClient.invalidateQueries({ queryKey: ['enrollmentStatus', leadId] });
}
