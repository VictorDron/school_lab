import { isPast, isToday } from 'date-fns';

interface DueDateInput {
  dueDate?: string | null;
  status?: string;
}

export const getDueDateStyle = (card: DueDateInput | null | undefined): string => {
  if (!card?.dueDate) return '';
  if (card.status === 'COMPLETED') return 'text-green-600';
  const due = new Date(card.dueDate);
  if (isPast(due) && !isToday(due)) return 'text-red-600';
  if (isToday(due)) return 'text-yellow-600';
  return 'text-neutral-600';
};
