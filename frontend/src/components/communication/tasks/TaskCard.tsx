import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, CheckSquare } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TaskCard as TaskCardType } from '@/types/communication';
import { Avatar } from '@/components/ui/Avatar';

interface TaskCardProps {
  card: TaskCardType;
  onClick: () => void;
}

const priorityBorderColors: Record<string, string> = {
  URGENT: 'border-l-red-500',
  HIGH: 'border-l-orange-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-blue-500',
  NONE: 'border-l-transparent',
};

export default function TaskCard({ card, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = card.status === 'COMPLETED';
  const hasLabels = card.labels && card.labels.length > 0;
  const hasDueDate = !!card.dueDate;
  const hasAssignees = card.assignees && card.assignees.length > 0;
  const commentCount = card._count?.comments ?? card.comments?.length ?? 0;

  // Checklist progress
  const allChecklistItems = card.checklists?.flatMap((cl) => cl.items) || [];
  const checkedItems = allChecklistItems.filter((item) => item.isComplete);
  const totalItems = allChecklistItems.length;
  const checklistProgress = totalItems > 0 ? (checkedItems.length / totalItems) * 100 : 0;
  const hasChecklist = totalItems > 0;

  // Due date styling
  const getDueDateStyle = () => {
    if (!card.dueDate) return '';
    if (isCompleted) return 'bg-green-100 text-green-700';
    const due = new Date(card.dueDate);
    if (isPast(due) && !isToday(due)) return 'bg-red-100 text-red-700';
    if (isToday(due)) return 'bg-yellow-100 text-yellow-700';
    return 'bg-neutral-100 text-neutral-600';
  };

  const displayAssignees = card.assignees?.slice(0, 3) || [];
  const extraAssignees = (card.assignees?.length ?? 0) - 3;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md cursor-pointer transition-all border-l-[3px] ${
        priorityBorderColors[card.priority] || 'border-l-transparent'
      } ${isDragging ? 'opacity-50 shadow-lg' : ''} ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      {/* Cover Image */}
      {card.coverImage && (
        <img
          src={card.coverImage}
          alt=""
          className="w-full h-28 object-cover rounded-t-lg"
        />
      )}

      <div className="p-2.5">
        {/* Labels */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {card.labels!.map((labelRef) => (
              <div
                key={labelRef.id}
                className="w-8 h-1.5 rounded-full"
                style={{ backgroundColor: labelRef.label.color }}
                title={labelRef.label.name}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p
          className={`text-sm font-medium text-neutral-800 leading-snug ${
            isCompleted ? 'line-through text-neutral-500' : ''
          }`}
        >
          {card.title}
        </p>

        {/* Metadata Row */}
        {(hasDueDate || hasChecklist || commentCount > 0 || hasAssignees) && (
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Due Date */}
              {hasDueDate && (
                <span
                  className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${getDueDateStyle()}`}
                >
                  <Calendar className="w-3 h-3" />
                  {format(new Date(card.dueDate!), 'dd MMM', { locale: ptBR })}
                </span>
              )}

              {/* Checklist Progress */}
              {hasChecklist && (
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    checkedItems.length === totalItems ? 'text-green-600' : 'text-neutral-500'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                  {checkedItems.length}/{totalItems}
                </span>
              )}

              {/* Comment Count */}
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
                  <MessageSquare className="w-3 h-3" />
                  {commentCount}
                </span>
              )}
            </div>

            {/* Assignees */}
            {hasAssignees && (
              <div className="flex -space-x-1.5">
                {displayAssignees.map((assignment) => (
                  <Avatar
                    key={assignment.id}
                    src={assignment.user.avatarUrl}
                    name={assignment.user.displayName}
                    size="xs"
                    className="ring-2 ring-white"
                  />
                ))}
                {extraAssignees > 0 && (
                  <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center ring-2 ring-white">
                    +{extraAssignees}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Checklist mini progress bar */}
        {hasChecklist && (
          <div className="mt-2 h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                checklistProgress === 100 ? 'bg-green-500' : 'bg-primary-400'
              }`}
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
