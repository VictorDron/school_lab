import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  useAddCardLabel,
  useAddChecklistItem,
  useAddTaskComment,
  useAssignUser,
  useCompleteCard,
  useCreateChecklist,
  useRemoveCardLabel,
  useTaskCard,
  useTaskComments,
  useToggleChecklistItem,
  useUnassignUser,
  useUpdateCard,
} from '@/hooks/useTaskCards';
import { useBoardLabels } from '@/hooks/useTaskBoards';
import { useAllUsers, useUserSearch } from '@/hooks/useUserSearch';
import { useAuthStore } from '@/stores/authStore';
import type { TaskLabel } from '@/types/communication';

interface UseTaskCardModalOptions {
  cardId: string;
  boardId: string;
}

export function useTaskCardModal({ cardId, boardId }: UseTaskCardModalOptions) {
  const { user } = useAuthStore();
  const { data: card, isLoading } = useTaskCard(cardId);
  const { data: commentsData } = useTaskComments(cardId);
  const { data: boardLabels = [] } = useBoardLabels(boardId);

  const [memberSearch, setMemberSearch] = useState('');
  const { data: allUsers = [] } = useAllUsers();
  const { data: searchedUsers } = useUserSearch(memberSearch);
  const memberSearchInputRef = useRef<HTMLInputElement>(null);
  const displayedUsers = memberSearch.length >= 1 ? (searchedUsers || []) : allUsers;

  const updateCard = useUpdateCard();
  const assignUser = useAssignUser();
  const unassignUser = useUnassignUser();
  const completeCard = useCompleteCard();
  const createChecklist = useCreateChecklist();
  const toggleChecklistItem = useToggleChecklistItem();
  const addChecklistItem = useAddChecklistItem();
  const addComment = useAddTaskComment();
  const addCardLabel = useAddCardLabel();
  const removeCardLabel = useRemoveCardLabel();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');
  const [commentText, setCommentText] = useState('');
  const [showMembersPicker, setShowMembersPicker] = useState(false);
  const [showLabelsPicker, setShowLabelsPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [dueDate, setDueDate] = useState('');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const comments = commentsData?.data || [];

  // Sync card -> local edit state
  useEffect(() => {
    if (card) {
      setTitleValue(card.title);
      setDescriptionValue(card.description || '');
      setDueDate(card.dueDate ? card.dueDate.split('T')[0] : '');
    }
  }, [card]);

  // Scroll to bottom of comments when new comment added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue === card?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await updateCard.mutateAsync({ cardId, title: titleValue.trim() });
      setEditingTitle(false);
    } catch {
      toast.error('Erro ao atualizar titulo');
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateCard.mutateAsync({ cardId, description: descriptionValue });
      setEditingDescription(false);
      toast.success('Descrição atualizada');
    } catch {
      toast.error('Erro ao atualizar descricao');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ cardId, content: commentText.trim() });
      setCommentText('');
    } catch {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleToggleAssignee = async (userId: string) => {
    const isAssigned = card?.assignees?.some((a) => a.userId === userId);
    try {
      if (isAssigned) {
        await unassignUser.mutateAsync({ cardId, userId });
      } else {
        await assignUser.mutateAsync({ cardId, userId });
      }
    } catch {
      toast.error('Erro ao alterar membro');
    }
  };

  const handleToggleLabel = async (label: TaskLabel) => {
    const hasLabel = card?.labels?.some((l) => l.labelId === label.id);
    try {
      if (hasLabel) {
        await removeCardLabel.mutateAsync({ cardId, labelId: label.id });
      } else {
        await addCardLabel.mutateAsync({ cardId, labelId: label.id });
      }
    } catch {
      toast.error('Erro ao alterar etiqueta');
    }
  };

  const handleSetDueDate = async () => {
    try {
      await updateCard.mutateAsync({
        cardId,
        dueDate: dueDate ? new Date(dueDate + 'T23:59:59').toISOString() : undefined,
      });
      setShowDatePicker(false);
      toast.success('Data atualizada');
    } catch {
      toast.error('Erro ao definir data');
    }
  };

  const handleCreateChecklist = async () => {
    if (!checklistTitle.trim()) return;
    try {
      await createChecklist.mutateAsync({ cardId, title: checklistTitle.trim() });
      setChecklistTitle('');
      setShowChecklistInput(false);
    } catch {
      toast.error('Erro ao criar checklist');
    }
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await addChecklistItem.mutateAsync({ checklistId, text, cardId });
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleComplete = async () => {
    try {
      await completeCard.mutateAsync(cardId);
      toast.success(card?.status === 'COMPLETED' ? 'Cartao reaberto' : 'Cartao concluido!');
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleToggleChecklistItem = (checklistId: string, itemId: string) => {
    toggleChecklistItem.mutate({ checklistId, itemId, cardId });
  };

  // Popover toggles — exclusive: opening one closes the others.
  const toggleMembersPicker = () => {
    const opening = !showMembersPicker;
    setShowMembersPicker(opening);
    setShowLabelsPicker(false);
    setShowDatePicker(false);
    if (opening) {
      setMemberSearch('');
      setTimeout(() => memberSearchInputRef.current?.focus(), 100);
    }
  };

  const toggleLabelsPicker = () => {
    setShowLabelsPicker(!showLabelsPicker);
    setShowMembersPicker(false);
    setShowDatePicker(false);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
    setShowMembersPicker(false);
    setShowLabelsPicker(false);
  };

  const openChecklistInput = () => {
    setShowChecklistInput(true);
    setShowMembersPicker(false);
    setShowLabelsPicker(false);
    setShowDatePicker(false);
  };

  const closeChecklistInput = () => {
    setShowChecklistInput(false);
    setChecklistTitle('');
  };

  const cancelTitleEdit = () => {
    if (card) setTitleValue(card.title);
    setEditingTitle(false);
  };

  const cancelDescriptionEdit = () => {
    setDescriptionValue(card?.description || '');
    setEditingDescription(false);
  };

  const clearDueDate = () => {
    setDueDate('');
    setShowDatePicker(false);
  };

  const isCompleted = card?.status === 'COMPLETED';

  return {
    card,
    isLoading,
    isCompleted,
    user,
    comments,
    boardLabels,
    displayedUsers,
    ui: {
      editingTitle,
      titleValue,
      editingDescription,
      descriptionValue,
      commentText,
      showMembersPicker,
      showLabelsPicker,
      showDatePicker,
      showChecklistInput,
      checklistTitle,
      newItemTexts,
      dueDate,
      memberSearch,
    },
    setters: {
      setEditingTitle,
      setTitleValue,
      setEditingDescription,
      setDescriptionValue,
      setCommentText,
      setChecklistTitle,
      setNewItemTexts,
      setDueDate,
      setMemberSearch,
    },
    refs: {
      titleInputRef,
      commentsEndRef,
      memberSearchInputRef,
    },
    mutations: {
      updateCardPending: updateCard.isPending,
      completeCardPending: completeCard.isPending,
      addCommentPending: addComment.isPending,
    },
    handlers: {
      handleSaveTitle,
      handleSaveDescription,
      handleAddComment,
      handleToggleAssignee,
      handleToggleLabel,
      handleSetDueDate,
      handleCreateChecklist,
      handleAddChecklistItem,
      handleComplete,
      handleToggleChecklistItem,
      toggleMembersPicker,
      toggleLabelsPicker,
      toggleDatePicker,
      openChecklistInput,
      closeChecklistInput,
      cancelTitleEdit,
      cancelDescriptionEdit,
      clearDueDate,
    },
  };
}
