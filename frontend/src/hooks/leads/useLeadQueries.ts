import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type {
  Lead,
  LeadFilters,
  LeadStats,
  PipelineStats,
  TokenStatus,
} from '@/types/crm';
import type { EnrollmentTokenStatus } from '@/types/enrollment';

// List leads with filters
export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () =>
      get<Lead[]>('/leads', {
        params: {
          search: filters.search || undefined,
          columnId: filters.columnId || undefined,
          source: filters.source || undefined,
          flagged: filters.flagged || undefined,
          page: filters.page || 1,
          limit: filters.limit || 20,
        },
      }),
  });
}

// Get single lead with full details
export function useLead(id: string | null) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => get<Lead>(`/leads/${id}`),
    enabled: !!id,
  });
}

// Get lead stats overview
export function useLeadStats() {
  return useQuery({
    queryKey: ['leadStats'],
    queryFn: () => get<LeadStats>('/leads/stats/overview'),
  });
}

// Get pipeline stats for funnel view
export function useLeadPipeline() {
  return useQuery({
    queryKey: ['leadPipeline'],
    queryFn: () => get<PipelineStats>('/leads/stats/pipeline'),
  });
}

// Get token status for a lead
export function useTokenStatus(leadId: string | null) {
  return useQuery({
    queryKey: ['tokenStatus', leadId],
    queryFn: () => get<TokenStatus>(`/leads/${leadId}/token-status`),
    enabled: !!leadId,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });
}

// Get enrollment token status for a lead
export function useEnrollmentTokenStatus(leadId: string | null) {
  return useQuery({
    queryKey: ['enrollmentStatus', leadId],
    queryFn: () => get<EnrollmentTokenStatus>(`/leads/${leadId}/enrollment-status`),
    enabled: !!leadId,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });
}
