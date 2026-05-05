import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUpdateLeadColumn } from '@/hooks/useLeads';
import { type Lead, type KanbanColumn as KanbanColumnType } from '@/types/crm';
import { KanbanView } from './KanbanView';
import { LeadCard } from './LeadCard';

interface LeadKanbanViewProps {
  pipelineColumns: KanbanColumnType[];
  finalColumns: KanbanColumnType[];
  leadsByColumn: Record<string, Lead[]>;
  onLeadClick: (lead: Lead) => void;
  canEdit: boolean;
  onOptimisticMove: (leadId: string, newColumnId: string) => void;
  onClearOptimisticMove: (leadId: string) => void;
}

export function LeadKanbanView({
  pipelineColumns,
  finalColumns,
  leadsByColumn,
  onLeadClick,
  canEdit,
  onOptimisticMove,
  onClearOptimisticMove,
}: LeadKanbanViewProps) {
  const queryClient = useQueryClient();
  const updateColumnMutation = useUpdateLeadColumn();

  const onMove = async (leadId: string, oldColumnId: string, newColumnId: string) => {
    queryClient.setQueryData(['leads', { limit: 500 }], (oldData: any) => {
      if (!oldData?.data) return oldData;
      return {
        ...oldData,
        data: oldData.data.map((lead: Lead) => (lead.id === leadId ? { ...lead, columnId: newColumnId } : lead)),
      };
    });

    try {
      await updateColumnMutation.mutateAsync({ id: leadId, columnId: newColumnId });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    } catch (error) {
      queryClient.setQueryData(['leads', { limit: 500 }], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((lead: Lead) => (lead.id === leadId ? { ...lead, columnId: oldColumnId } : lead)),
        };
      });
      toast.error('Erro ao atualizar coluna');
      throw error;
    }
  };

  return (
    <KanbanView<Lead>
      pipelineColumns={pipelineColumns}
      finalColumns={finalColumns}
      cardsByColumn={leadsByColumn}
      canEdit={canEdit}
      emptyColumnLabel="Nenhum lead"
      dragAndDrop={{
        onMove,
        onOptimisticMove,
        onClearOptimisticMove,
        getDragLabel: (lead) => lead.familyName,
      }}
      renderCard={(lead, helpers) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onLeadClick(lead)}
          onDragStart={helpers.onDragStart}
          onDragEnd={helpers.onDragEnd}
          canEdit={canEdit}
          isDragging={helpers.isDragging}
        />
      )}
    />
  );
}
