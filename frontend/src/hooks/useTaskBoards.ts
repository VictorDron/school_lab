import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api';
import type { TaskBoard, TaskBoardMember, TaskLabel } from '@/types/communication';

export function useTaskBoards() {
  return useQuery({
    queryKey: ['taskBoards'],
    queryFn: () => get<TaskBoard[]>('/task-boards'),
    select: (data) => data.data || [],
  });
}

export function useTaskBoard(boardId: string | null) {
  return useQuery({
    queryKey: ['taskBoard', boardId],
    queryFn: () => get<TaskBoard>(`/task-boards/${boardId}`),
    enabled: !!boardId,
    select: (data) => data.data,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; channelId?: string; visibility?: string }) =>
      post<TaskBoard>('/task-boards', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskBoards'] });
    },
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, ...data }: { boardId: string; name?: string; description?: string; visibility?: string }) =>
      patch(`/task-boards/${boardId}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskBoards'] });
      qc.invalidateQueries({ queryKey: ['taskBoard', vars.boardId] });
    },
  });
}

export function useArchiveBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => del(`/task-boards/${boardId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['taskBoards'] });
    },
  });
}

export function useBoardMembers(boardId: string | null) {
  return useQuery({
    queryKey: ['boardMembers', boardId],
    queryFn: () => get<TaskBoardMember[]>(`/task-boards/${boardId}/members`),
    enabled: !!boardId,
    select: (data) => data.data || [],
  });
}

export function useBoardLabels(boardId: string | null) {
  return useQuery({
    queryKey: ['boardLabels', boardId],
    queryFn: () => get<TaskLabel[]>(`/task-boards/${boardId}/labels`),
    enabled: !!boardId,
    select: (data) => data.data || [],
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, ...data }: { boardId: string; name: string; color: string }) =>
      post(`/task-boards/${boardId}/labels`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['boardLabels', vars.boardId] });
    },
  });
}

export function useReorderColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, columns }: { boardId: string; columns: { id: string; order: number }[] }) =>
      patch(`/task-boards/${boardId}/columns/reorder`, { columns }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskBoard', vars.boardId] });
    },
  });
}

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, ...data }: { boardId: string; name: string; color?: string }) =>
      post(`/task-boards/${boardId}/columns`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskBoard', vars.boardId] });
    },
  });
}
