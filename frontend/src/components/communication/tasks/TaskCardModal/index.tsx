import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { useTaskCardModal } from './useTaskCardModal';
import { TaskCardHeader } from './TaskCardHeader';
import { TaskCardMainContent } from './TaskCardMainContent';
import { TaskCardSidebar } from './TaskCardSidebar';

interface TaskCardModalProps {
  cardId: string;
  boardId: string;
  onClose: () => void;
}

export default function TaskCardModal({ cardId, boardId, onClose }: TaskCardModalProps) {
  const {
    card,
    isLoading,
    isCompleted,
    user,
    comments,
    boardLabels,
    displayedUsers,
    ui,
    setters,
    refs,
    mutations,
    handlers,
  } = useTaskCardModal({ cardId, boardId });

  const {
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
  } = ui;
  const {
    setEditingTitle,
    setTitleValue,
    setEditingDescription,
    setDescriptionValue,
    setCommentText,
    setChecklistTitle,
    setNewItemTexts,
    setDueDate,
    setMemberSearch,
  } = setters;
  const { titleInputRef, commentsEndRef, memberSearchInputRef } = refs;
  const {
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
  } = handlers;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!card) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8"
      >
        <TaskCardHeader
          cardTitle={card.title}
          cardCode={card.code}
          columnName={card.column?.name}
          isCompleted={isCompleted}
          editingTitle={editingTitle}
          titleValue={titleValue}
          titleInputRef={titleInputRef}
          onTitleChange={setTitleValue}
          onStartEditingTitle={() => setEditingTitle(true)}
          onSaveTitle={handleSaveTitle}
          onCancelTitleEdit={cancelTitleEdit}
          onClose={onClose}
        />

        {/* Body */}
        <div className="flex flex-col md:flex-row">
          <TaskCardMainContent
            card={card}
            isCompleted={isCompleted}
            description={{
              editing: editingDescription,
              value: descriptionValue,
              isSaving: mutations.updateCardPending,
              onChange: setDescriptionValue,
              onStartEdit: () => setEditingDescription(true),
              onSave: handleSaveDescription,
              onCancel: cancelDescriptionEdit,
            }}
            checklists={{
              newItemTexts,
              setNewItemTexts,
              onToggleItem: handleToggleChecklistItem,
              onAddItem: handleAddChecklistItem,
            }}
            comments={{
              list: comments,
              currentUser: user,
              text: commentText,
              isSubmitting: mutations.addCommentPending,
              endRef: commentsEndRef,
              onTextChange: setCommentText,
              onAdd: handleAddComment,
            }}
          />

          <TaskCardSidebar
            isCompleted={isCompleted}
            isCompletingPending={mutations.completeCardPending}
            cardAssignees={card.assignees}
            cardLabels={card.labels}
            boardLabels={boardLabels}
            displayedUsers={displayedUsers}
            members={{
              show: showMembersPicker,
              search: memberSearch,
              inputRef: memberSearchInputRef,
              onToggle: toggleMembersPicker,
              onSearchChange: setMemberSearch,
              onToggleAssignee: handleToggleAssignee,
            }}
            labels={{
              show: showLabelsPicker,
              onToggle: toggleLabelsPicker,
              onToggleLabel: handleToggleLabel,
            }}
            dueDate={{
              show: showDatePicker,
              value: dueDate,
              onToggle: toggleDatePicker,
              onChange: setDueDate,
              onSave: handleSetDueDate,
              onClear: clearDueDate,
            }}
            checklist={{
              show: showChecklistInput,
              title: checklistTitle,
              onOpen: openChecklistInput,
              onClose: closeChecklistInput,
              onTitleChange: setChecklistTitle,
              onCreate: handleCreateChecklist,
            }}
            onComplete={handleComplete}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
