import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { ReEnrollmentKanbanPayload } from '@/types/re-enrollment-kanban';

export function useReEnrollmentKanbanView(periodId: string | null) {
  return useQuery({
    queryKey: ['reEnrollmentKanbanView', periodId],
    queryFn: () => get<ReEnrollmentKanbanPayload>(`/re-enrollment/periods/${periodId}/kanban-view`),
    enabled: !!periodId,
    refetchOnWindowFocus: false,
  });
}
