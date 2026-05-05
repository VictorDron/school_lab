import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  onCrmLeadListUpdated,
  onCrmLeadUpdated,
  joinCrmPipeline,
  leaveCrmPipeline,
  joinCrmLead,
  leaveCrmLead,
} from '@/lib/socket';
import { invalidateLeadRelated } from './useLeadDashboard';

/**
 * Connects the CRM pipeline view to Socket.io for real-time updates.
 * Joins the crm:pipeline room and listens for list invalidation events.
 * Call this in CRMPipelineView — not in individual query hooks.
 */
export function useCrmSocketSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    joinCrmPipeline();

    const cleanupListListener = onCrmLeadListUpdated(() => {
      // Invalidate lead list queries — covers kanban, list view, stats
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    });

    return () => {
      leaveCrmPipeline();
      cleanupListListener();
    };
  }, [queryClient]);
}

/**
 * Connects a specific lead detail view to Socket.io for real-time updates.
 * Joins lead:{leadId} room and listens for lead-specific events.
 * Call this in the lead detail drawer/component with the active leadId.
 */
export function useCrmLeadSocketSync(leadId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leadId) return;

    joinCrmLead(leadId);

    const cleanup = onCrmLeadUpdated((data) => {
      if (data.leadId === leadId) {
        invalidateLeadRelated(queryClient, leadId);
      }
    });

    return () => {
      leaveCrmLead(leadId);
      cleanup();
    };
  }, [leadId, queryClient]);
}
