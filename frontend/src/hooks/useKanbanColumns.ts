import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  KanbanColumn,
  CreateKanbanColumnData,
  UpdateKanbanColumnData,
  ReorderKanbanColumnsData,
  DeleteKanbanColumnData,
} from '@/types/crm';

// ==================== QUERIES ====================

// List all kanban columns (ordered)
export function useKanbanColumns() {
  return useQuery({
    queryKey: ['kanbanColumns'],
    queryFn: () => get<KanbanColumn[]>('/kanban-columns'),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes as columns rarely change
  });
}

// Get single kanban column
export function useKanbanColumn(id: string | null) {
  return useQuery({
    queryKey: ['kanbanColumn', id],
    queryFn: () => get<KanbanColumn>(`/kanban-columns/${id}`),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

// Create kanban column
export function useCreateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateKanbanColumnData) => post<KanbanColumn>('/kanban-columns', data),
    onSuccess: () => {
      toast.success('Coluna criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Update kanban column
export function useUpdateKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKanbanColumnData }) =>
      patch<KanbanColumn>(`/kanban-columns/${id}`, data),
    onSuccess: (_, variables) => {
      toast.success('Coluna atualizada!');
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
      queryClient.invalidateQueries({ queryKey: ['kanbanColumn', variables.id] });
      // Also invalidate leads as they may have column info
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete kanban column
export function useDeleteKanbanColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, targetColumnId }: { id: string; targetColumnId?: string }) =>
      del<void>(`/kanban-columns/${id}`, { data: { targetColumnId } }),
    onSuccess: () => {
      toast.success('Coluna excluida!');
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadStats'] });
      queryClient.invalidateQueries({ queryKey: ['leadPipeline'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Reorder kanban columns with optimistic update
export function useReorderKanbanColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderKanbanColumnsData) =>
      patch<KanbanColumn[]>('/kanban-columns/reorder', data),
    onMutate: async (data) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kanbanColumns'] });

      // Snapshot the previous value
      const previousColumns = queryClient.getQueryData(['kanbanColumns']);

      // Optimistically update the order
      queryClient.setQueryData(
        ['kanbanColumns'],
        (old: { success: boolean; data: KanbanColumn[] } | undefined) => {
          if (!old?.data) return old;

          // Create a map of new orders
          const orderMap = new Map(data.columns.map((c) => [c.id, c.order]));

          // Update orders and sort
          const updatedColumns = old.data
            .map((col) => ({
              ...col,
              order: orderMap.has(col.id) ? orderMap.get(col.id)! : col.order,
            }))
            .sort((a, b) => a.order - b.order);

          return { ...old, data: updatedColumns };
        }
      );

      return { previousColumns };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousColumns) {
        queryClient.setQueryData(['kanbanColumns'], context.previousColumns);
      }
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      // Refetch in background to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['kanbanColumns'] });
    },
  });
}
