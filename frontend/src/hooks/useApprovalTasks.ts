import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';

interface PendingSummary {
  totalPending: number;
  byDepartment: Record<string, number>;
  overdue: number;
  myPending: number;
}

interface PendingApprovalTask {
  id: string;
  title: string;
  sourceLeadId: string;
  createdAt: string;
  gateApproval: {
    department: string;
    gateStep: string;
    lead: {
      familyName: string;
      code: string;
    };
  };
}

export function usePendingSummary() {
  return useQuery({
    queryKey: ['pending-summary'],
    queryFn: () => get<PendingSummary>('/gate-approvals/pending-summary'),
    select: (data) => data.data,
  });
}

export function useMyPendingApprovals() {
  return useQuery({
    queryKey: ['my-pending-approvals'],
    queryFn: () => get<PendingApprovalTask[]>('/gate-approvals/my-pending'),
    select: (data) => data.data,
  });
}
