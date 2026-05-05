import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KanbanCardBase, KanbanColumnDef } from '@/types/kanban';
import { KanbanColumn } from './KanbanColumn';

/**
 * Helpers passed to a card renderer by the Kanban layout.
 *
 * When the board is read-only (`dragAndDrop` prop is omitted), `onDragStart`
 * and `onDragEnd` are silent no-ops and `canDrag` is `false`. Card renderers
 * should wire these handlers unconditionally and never branch on their
 * existence — the helpers are always safe to call.
 */
export interface CardRenderHelpers<T> {
  isDragging: boolean;
  canDrag: boolean;
  onDragStart: (e: React.DragEvent, card: T) => void;
  onDragEnd: () => void;
}

export interface KanbanDragAndDropConfig<T> {
  onMove: (cardId: string, from: string, to: string) => Promise<void>;
  onOptimisticMove: (cardId: string, newColumnId: string) => void;
  onClearOptimisticMove: (cardId: string) => void;
  getDragLabel: (card: T) => string;
}

export interface KanbanViewProps<T extends KanbanCardBase> {
  pipelineColumns: KanbanColumnDef[];
  finalColumns: KanbanColumnDef[];
  cardsByColumn: Record<string, T[]>;
  renderCard: (card: T, helpers: CardRenderHelpers<T>) => ReactNode;
  canEdit: boolean;
  /**
   * When omitted, the board is read-only: cards cannot be dragged between
   * columns. Action-driven entities (e.g. re-enrollment invites whose gate
   * transitions are command-only) should leave this undefined.
   */
  dragAndDrop?: KanbanDragAndDropConfig<T>;
  emptyColumnLabel?: string;
}

const NOOP_DRAG_START = () => {};
const NOOP_DRAG_END = () => {};

export function KanbanView<T extends KanbanCardBase>({
  pipelineColumns,
  finalColumns,
  cardsByColumn,
  renderCard,
  canEdit,
  dragAndDrop,
  emptyColumnLabel,
}: KanbanViewProps<T>) {
  const [draggingCard, setDraggingCard] = useState<T | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const dragEnabled = !!dragAndDrop && canEdit;

  // Collapsed columns state — auto-collapse empty columns
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const allColumns = [...pipelineColumns, ...finalColumns];
    setCollapsedColumns((prev) => {
      const next: Record<string, boolean> = {};
      for (const col of allColumns) {
        const cards = cardsByColumn[col.id] || [];
        if (cards.length === 0) {
          next[col.id] = prev[col.id] ?? true;
        } else {
          next[col.id] = false;
        }
      }
      return next;
    });
  }, [cardsByColumn, pipelineColumns, finalColumns]);

  const toggleCollapse = (columnId: string) => {
    setCollapsedColumns((prev) => ({ ...prev, [columnId]: !prev[columnId] }));
  };

  // Scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const grabState = useRef({ isDown: false, startX: 0, scrollLeft: 0 });

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
  }, [updateScrollIndicators, pipelineColumns, finalColumns]);

  const scrollBy = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[draggable]')) return;
    grabState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    setIsGrabbing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!grabState.current.isDown) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - grabState.current.startX) * 1.5;
    el.scrollLeft = grabState.current.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    grabState.current.isDown = false;
    setIsGrabbing(false);
  };

  const handleDragStart = (e: React.DragEvent, card: T) => {
    if (!dragEnabled || !dragAndDrop) return;
    setDraggingCard(card);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);

    const dragImage = document.createElement('div');
    dragImage.className = 'bg-white rounded-lg shadow-xl p-3 border-2 border-primary-500';
    const span = document.createElement('span');
    span.className = 'font-semibold';
    span.textContent = dragAndDrop.getDragLabel(card);
    dragImage.appendChild(span);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggingCard(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!dragEnabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = async (e: React.DragEvent, newColumnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);

    if (!draggingCard || !dragEnabled || !dragAndDrop) return;
    if (draggingCard.columnId === newColumnId) return;

    const cardId = draggingCard.id;
    const oldColumnId = draggingCard.columnId;

    dragAndDrop.onOptimisticMove(cardId, newColumnId);
    setDraggingCard(null);

    try {
      await dragAndDrop.onMove(cardId, oldColumnId, newColumnId);
    } catch {
      // Consumer handles rollback + user-facing error feedback.
    } finally {
      dragAndDrop.onClearOptimisticMove(cardId);
    }
  };

  const buildHelpers = useCallback(
    (card: T): CardRenderHelpers<T> => ({
      isDragging: draggingCard?.id === card.id,
      canDrag: dragEnabled,
      onDragStart: dragEnabled ? handleDragStart : NOOP_DRAG_START,
      onDragEnd: dragEnabled ? handleDragEnd : NOOP_DRAG_END,
    }),
    [draggingCard, dragEnabled],
  );

  const dragState = (columnId: string) => {
    if (!dragEnabled) return null;
    return {
      isDragOver: dragOverColumnId === columnId,
      draggingCard,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    };
  };

  return (
    <div className="relative h-full group/kanban">
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

      <div
        ref={scrollRef}
        className={`h-full overflow-x-auto kanban-scroll ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex gap-3 p-4 lg:p-6 h-full min-w-max">
          {pipelineColumns.map((column) => (
            <KanbanColumn<T>
              key={column.id}
              column={column}
              cards={cardsByColumn[column.id] || []}
              renderCard={renderCard}
              buildHelpers={buildHelpers}
              canEdit={canEdit}
              dragState={dragState(column.id)}
              isCollapsed={collapsedColumns[column.id]}
              onToggleCollapse={() => toggleCollapse(column.id)}
              emptyColumnLabel={emptyColumnLabel}
            />
          ))}

          {finalColumns.length > 0 && <div className="w-px bg-neutral-300 mx-1 self-stretch flex-shrink-0" />}

          {finalColumns.map((column) => (
            <KanbanColumn<T>
              key={column.id}
              column={column}
              cards={cardsByColumn[column.id] || []}
              renderCard={renderCard}
              buildHelpers={buildHelpers}
              canEdit={canEdit}
              isFinal
              dragState={dragState(column.id)}
              isCollapsed={collapsedColumns[column.id]}
              onToggleCollapse={() => toggleCollapse(column.id)}
              emptyColumnLabel={emptyColumnLabel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
