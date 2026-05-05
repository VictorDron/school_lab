import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, del } from '@/lib/api';
import type { TaskCard, TaskComment } from '@/types/communication';

export function useTaskCard(cardId: string | null) {
  return useQuery({
    queryKey: ['taskCard', cardId],
    queryFn: () => get<TaskCard>(`/tasks/cards/${cardId}`),
    enabled: !!cardId,
    select: (data) => data.data,
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, ...data }: { boardId: string; columnId: string; title: string; description?: string; priority?: string; dueDate?: string }) =>
      post(`/tasks/boards/${boardId}/cards`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskBoard', vars.boardId] });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, ...data }: { cardId: string; title?: string; description?: string; priority?: string; dueDate?: string; coverImage?: string }) =>
      patch(`/tasks/cards/${cardId}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, columnId, order }: { cardId: string; columnId: string; order: number; boardId: string }) =>
      post(`/tasks/cards/${cardId}/move`, { columnId, order }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskBoard', vars.boardId] });
    },
  });
}

export function useAssignUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, userId }: { cardId: string; userId: string }) =>
      post(`/tasks/cards/${cardId}/assign`, { userId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useUnassignUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, userId }: { cardId: string; userId: string }) =>
      del(`/tasks/cards/${cardId}/assign/${userId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useCompleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => post(`/tasks/cards/${cardId}/complete`, {}),
    onSuccess: (_, cardId) => {
      qc.invalidateQueries({ queryKey: ['taskCard', cardId] });
    },
  });
}

export function useAddCardLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      post(`/tasks/cards/${cardId}/labels`, { labelId }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useRemoveCardLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      del(`/tasks/cards/${cardId}/labels/${labelId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

// Checklists
export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, title }: { cardId: string; title: string }) =>
      post(`/tasks/cards/${cardId}/checklists`, { title }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId, cardId }: { checklistId: string; itemId: string; cardId: string }) =>
      patch(`/tasks/checklists/${checklistId}/items/${itemId}`, {}),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

export function useAddChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, text, cardId }: { checklistId: string; text: string; cardId: string }) =>
      post(`/tasks/checklists/${checklistId}/items`, { text }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}

// Comments
export function useTaskComments(cardId: string | null) {
  return useQuery({
    queryKey: ['taskComments', cardId],
    queryFn: () => get<TaskComment[]>(`/tasks/cards/${cardId}/comments`),
    enabled: !!cardId,
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, content }: { cardId: string; content: string }) =>
      post(`/tasks/cards/${cardId}/comments`, { content }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['taskComments', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['taskCard', vars.cardId] });
    },
  });
}
