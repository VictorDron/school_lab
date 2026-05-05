import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTaskBoard, useCreateColumn } from '@/hooks/useTaskBoards';
import { useMoveCard } from '@/hooks/useTaskCards';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import type { TaskCard as TaskCardType } from '@/types/communication';
import TaskColumn from './TaskColumn';
import TaskCard from './TaskCard';
import TaskCardModal from './TaskCardModal';
import TaskFilterBar from './TaskFilterBar';

interface TaskBoardProps {
  boardId: string;
}

export interface TaskFilters {
  search: string;
  assigneeId: string;
  labelId: string;
  dueDateFilter: '' | 'overdue' | 'thisWeek' | 'noDueDate';
}

const defaultFilters: TaskFilters = {
  search: '',
  assigneeId: '',
  labelId: '',
  dueDateFilter: '',
};

export default function TaskBoard({ boardId }: TaskBoardProps) {
  const { data: board, isLoading } = useTaskBoard(boardId);
  const createColumn = useCreateColumn();
  const moveCard = useMoveCard();

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [activeCard, setActiveCard] = useState<TaskCardType | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);

  // Scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const updateScrollIndicators = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    const observer = new ResizeObserver(updateScrollIndicators);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      observer.disconnect();
    };
  }, [updateScrollIndicators, board?.columns]);

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const overColumnId = over.id as string;

    // Find the card to get its current column
    const card = findCard(cardId);
    if (!card || card.columnId === overColumnId) return;

    // Find how many cards are in the target column for order
    const targetColumn = board?.columns?.find((c) => c.id === overColumnId);
    const order = targetColumn?.cards?.length ?? 0;

    try {
      await moveCard.mutateAsync({ cardId, columnId: overColumnId, order, boardId });
    } catch {
      toast.error('Erro ao mover cartao');
    }
  };

  const findCard = (cardId: string): TaskCardType | null => {
    if (!board?.columns) return null;
    for (const col of board.columns) {
      const card = col.cards?.find((c) => c.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const handleCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await createColumn.mutateAsync({ boardId, name: newColumnName.trim() });
      setNewColumnName('');
      setAddingColumn(false);
      toast.success('Coluna criada!');
    } catch {
      toast.error('Erro ao criar coluna');
    }
  };

  // Filter cards in each column
  const filterCards = (cards: TaskCardType[]): TaskCardType[] => {
    let filtered = [...cards];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(q));
    }

    if (filters.assigneeId) {
      filtered = filtered.filter((c) =>
        c.assignees?.some((a) => a.userId === filters.assigneeId)
      );
    }

    if (filters.labelId) {
      filtered = filtered.filter((c) =>
        c.labels?.some((l) => l.labelId === filters.labelId)
      );
    }

    if (filters.dueDateFilter === 'overdue') {
      const now = new Date();
      filtered = filtered.filter(
        (c) => c.dueDate && new Date(c.dueDate) < now && c.status !== 'COMPLETED'
      );
    } else if (filters.dueDateFilter === 'thisWeek') {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      filtered = filtered.filter(
        (c) => c.dueDate && new Date(c.dueDate) <= endOfWeek && new Date(c.dueDate) >= now
      );
    } else if (filters.dueDateFilter === 'noDueDate') {
      filtered = filtered.filter((c) => !c.dueDate);
    }

    return filtered;
  };

  const hasActiveFilters =
    filters.search || filters.assigneeId || filters.labelId || filters.dueDateFilter;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        <p>Quadro não encontrado</p>
      </div>
    );
  }

  const columns = board.columns || [];

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <TaskFilterBar boardId={boardId} filters={filters} onFiltersChange={setFilters} />

      {/* Board */}
      <div className="relative flex-1 overflow-hidden">
        {/* Left scroll indicator */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'linear-gradient(to right, rgb(249 250 251 / 0.9), transparent)' }}
        >
          <button
            onClick={() => scrollBy('left')}
            className="pointer-events-auto absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:shadow-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Right scroll indicator */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ background: 'linear-gradient(to left, rgb(249 250 251 / 0.9), transparent)' }}
        >
          <button
            onClick={() => scrollBy('right')}
            className="pointer-events-auto absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:shadow-lg transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable container */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            ref={scrollRef}
            className="h-full overflow-x-auto overflow-y-hidden"
          >
            <div className="flex gap-4 p-4 h-full min-w-max items-start">
              {columns
                .sort((a, b) => a.order - b.order)
                .map((column) => (
                  <TaskColumn
                    key={column.id}
                    column={{
                      ...column,
                      cards: hasActiveFilters
                        ? filterCards(column.cards || [])
                        : column.cards,
                    }}
                    boardId={boardId}
                    onCardClick={(cardId) => setSelectedCardId(cardId)}
                  />
                ))}

              {/* Add Column */}
              <div className="w-72 flex-shrink-0">
                {addingColumn ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Nome da coluna..."
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateColumn();
                        if (e.key === 'Escape') {
                          setAddingColumn(false);
                          setNewColumnName('');
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleCreateColumn}
                        disabled={!newColumnName.trim() || createColumn.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Criar
                      </button>
                      <button
                        onClick={() => {
                          setAddingColumn(false);
                          setNewColumnName('');
                        }}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-neutral-100/80 hover:bg-neutral-200/80 rounded-xl text-neutral-500 text-sm font-medium transition-colors border border-dashed border-neutral-300"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Coluna
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeCard && (
              <div className="rotate-3 opacity-90">
                <TaskCard card={activeCard} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card Detail Modal */}
      {selectedCardId && (
        <TaskCardModal
          cardId={selectedCardId}
          boardId={boardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
