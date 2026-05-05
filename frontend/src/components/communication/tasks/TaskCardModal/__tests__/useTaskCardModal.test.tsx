import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const mutationStub = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
});

vi.mock('@/hooks/useTaskCards', () => ({
  useTaskCard: vi.fn(),
  useUpdateCard: vi.fn(() => mutationStub()),
  useAssignUser: vi.fn(() => mutationStub()),
  useUnassignUser: vi.fn(() => mutationStub()),
  useCompleteCard: vi.fn(() => mutationStub()),
  useCreateChecklist: vi.fn(() => mutationStub()),
  useToggleChecklistItem: vi.fn(() => mutationStub()),
  useAddChecklistItem: vi.fn(() => mutationStub()),
  useTaskComments: vi.fn(),
  useAddTaskComment: vi.fn(() => mutationStub()),
  useAddCardLabel: vi.fn(() => mutationStub()),
  useRemoveCardLabel: vi.fn(() => mutationStub()),
}));

vi.mock('@/hooks/useTaskBoards', () => ({
  useBoardLabels: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/hooks/useUserSearch', () => ({
  useAllUsers: vi.fn(() => ({ data: [] })),
  useUserSearch: vi.fn(() => ({ data: [] })),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

import { useTaskCard, useTaskComments } from '@/hooks/useTaskCards';
import { useTaskCardModal } from '../useTaskCardModal';

beforeEach(() => {
  vi.mocked(useTaskCard).mockReturnValue({ data: undefined, isLoading: false } as any);
  vi.mocked(useTaskComments).mockReturnValue({ data: undefined } as any);
});

describe('useTaskCardModal - initial state', () => {
  it('starts with edit flags off and pickers closed', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    expect(result.current.ui.editingTitle).toBe(false);
    expect(result.current.ui.editingDescription).toBe(false);
    expect(result.current.ui.showMembersPicker).toBe(false);
    expect(result.current.ui.showLabelsPicker).toBe(false);
    expect(result.current.ui.showDatePicker).toBe(false);
    expect(result.current.ui.showChecklistInput).toBe(false);
    expect(result.current.ui.commentText).toBe('');
    expect(result.current.ui.checklistTitle).toBe('');
    expect(result.current.ui.memberSearch).toBe('');
    expect(result.current.ui.dueDate).toBe('');
    expect(result.current.ui.newItemTexts).toEqual({});
  });

  it('reports isCompleted=false when no card data is loaded yet', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));
    expect(result.current.isCompleted).toBe(false);
  });

  it('derives isCompleted from card status', () => {
    vi.mocked(useTaskCard).mockReturnValue({
      data: { status: 'COMPLETED', title: 't', description: '', dueDate: null },
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));
    expect(result.current.isCompleted).toBe(true);
  });
});

describe('useTaskCardModal - popover toggles', () => {
  it('opening members picker closes labels and date pickers', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleLabelsPicker();
    });
    expect(result.current.ui.showLabelsPicker).toBe(true);

    act(() => {
      result.current.handlers.toggleMembersPicker();
    });
    expect(result.current.ui.showMembersPicker).toBe(true);
    expect(result.current.ui.showLabelsPicker).toBe(false);
    expect(result.current.ui.showDatePicker).toBe(false);
  });

  it('opening labels picker closes members and date pickers', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleMembersPicker();
    });
    expect(result.current.ui.showMembersPicker).toBe(true);

    act(() => {
      result.current.handlers.toggleLabelsPicker();
    });
    expect(result.current.ui.showLabelsPicker).toBe(true);
    expect(result.current.ui.showMembersPicker).toBe(false);
    expect(result.current.ui.showDatePicker).toBe(false);
  });

  it('opening date picker closes members and labels pickers', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleMembersPicker();
      result.current.handlers.toggleLabelsPicker();
    });

    act(() => {
      result.current.handlers.toggleDatePicker();
    });
    expect(result.current.ui.showDatePicker).toBe(true);
    expect(result.current.ui.showMembersPicker).toBe(false);
    expect(result.current.ui.showLabelsPicker).toBe(false);
  });

  it('opening checklist input closes the three picker popovers', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleMembersPicker();
      result.current.handlers.toggleLabelsPicker();
      result.current.handlers.toggleDatePicker();
    });

    act(() => {
      result.current.handlers.openChecklistInput();
    });
    expect(result.current.ui.showChecklistInput).toBe(true);
    expect(result.current.ui.showMembersPicker).toBe(false);
    expect(result.current.ui.showLabelsPicker).toBe(false);
    expect(result.current.ui.showDatePicker).toBe(false);
  });

  it('toggling members picker a second time closes it', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleMembersPicker();
    });
    expect(result.current.ui.showMembersPicker).toBe(true);

    act(() => {
      result.current.handlers.toggleMembersPicker();
    });
    expect(result.current.ui.showMembersPicker).toBe(false);
  });
});

describe('useTaskCardModal - edit cancel handlers', () => {
  it('cancelTitleEdit restores card title and exits edit mode', () => {
    vi.mocked(useTaskCard).mockReturnValue({
      data: { status: 'OPEN', title: 'Original', description: '', dueDate: null },
      isLoading: false,
    } as any);

    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.setters.setEditingTitle(true);
      result.current.setters.setTitleValue('Edited');
    });
    expect(result.current.ui.titleValue).toBe('Edited');

    act(() => {
      result.current.handlers.cancelTitleEdit();
    });
    expect(result.current.ui.editingTitle).toBe(false);
    expect(result.current.ui.titleValue).toBe('Original');
  });

  it('closeChecklistInput resets the title field', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.openChecklistInput();
      result.current.setters.setChecklistTitle('Draft list');
    });
    expect(result.current.ui.checklistTitle).toBe('Draft list');

    act(() => {
      result.current.handlers.closeChecklistInput();
    });
    expect(result.current.ui.showChecklistInput).toBe(false);
    expect(result.current.ui.checklistTitle).toBe('');
  });

  it('clearDueDate empties dueDate and closes the picker', () => {
    const { result } = renderHook(() => useTaskCardModal({ cardId: 'c1', boardId: 'b1' }));

    act(() => {
      result.current.handlers.toggleDatePicker();
      result.current.setters.setDueDate('2026-12-31');
    });
    expect(result.current.ui.dueDate).toBe('2026-12-31');
    expect(result.current.ui.showDatePicker).toBe(true);

    act(() => {
      result.current.handlers.clearDueDate();
    });
    expect(result.current.ui.dueDate).toBe('');
    expect(result.current.ui.showDatePicker).toBe(false);
  });
});
