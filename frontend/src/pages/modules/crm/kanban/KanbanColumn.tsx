import { useState, useEffect, type ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { KanbanCardBase, KanbanColumnDef } from '@/types/kanban';
import type { CardRenderHelpers } from './KanbanView';

export interface KanbanColumnDragState<T extends KanbanCardBase> {
  isDragOver: boolean;
  draggingCard: T | null;
  onDragStart: (e: React.DragEvent, card: T) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
}

export interface KanbanColumnProps<T extends KanbanCardBase> {
  column: KanbanColumnDef;
  cards: T[];
  renderCard: (card: T, helpers: CardRenderHelpers<T>) => ReactNode;
  buildHelpers: (card: T) => CardRenderHelpers<T>;
  canEdit: boolean;
  isFinal?: boolean;
  /**
   * When `null`, drag-and-drop is disabled for this column — no drop target,
   * no visual drag affordances.
   */
  dragState: KanbanColumnDragState<T> | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  emptyColumnLabel?: string;
}

export function KanbanColumn<T extends KanbanCardBase>({
  column,
  cards,
  renderCard,
  buildHelpers,
  isFinal,
  dragState,
  isCollapsed,
  onToggleCollapse,
  emptyColumnLabel,
}: KanbanColumnProps<T>) {
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    setVisibleCount(10);
  }, [column.id]);

  const isValidDropTarget = !!dragState && dragState.draggingCard !== null && dragState.draggingCard.columnId !== column.id;
  const isDragOver = dragState?.isDragOver ?? false;

  const lightBgColor = `${column.color}20`;

  const shouldCollapse = isCollapsed && cards.length === 0 && !(isDragOver && isValidDropTarget);

  const dropHandlers = dragState
    ? {
        onDragOver: (e: React.DragEvent) => dragState.onDragOver(e, column.id),
        onDragLeave: dragState.onDragLeave,
        onDrop: (e: React.DragEvent) => dragState.onDrop(e, column.id),
      }
    : {};

  if (shouldCollapse) {
    return (
      <div
        className="flex flex-col w-12 flex-shrink-0 cursor-pointer rounded-lg transition-all duration-150 hover:opacity-80"
        style={{ backgroundColor: lightBgColor }}
        onClick={onToggleCollapse}
        {...dropHandlers}
      >
        <div className="flex flex-col items-center py-3 gap-2 h-full">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <span
            className="font-semibold text-xs text-neutral-500 whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {column.name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col ${isFinal ? 'w-52' : 'w-64'} flex-shrink-0 transition-transform duration-150 ${
        isDragOver && isValidDropTarget ? 'scale-[1.02]' : ''
      }`}
      {...dropHandlers}
    >
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg transition-all duration-150 ${
          isDragOver && isValidDropTarget ? 'ring-2 ring-primary-500 ring-offset-1' : ''
        }`}
        style={{ backgroundColor: lightBgColor }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: column.color }} />
          <span className="font-semibold text-sm text-neutral-800">{column.name}</span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${column.color}30`, color: column.color }}
          >
            {cards.length}
          </span>
        </div>
      </div>

      <div
        className={`flex-1 rounded-b-lg p-2 overflow-y-auto space-y-2 min-h-[150px] transition-colors duration-150 ${
          isDragOver && isValidDropTarget ? 'bg-primary-50 border-2 border-dashed border-primary-300' : 'bg-neutral-100'
        }`}
      >
        {cards.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center gap-1.5 min-h-20 py-6 px-3 text-center transition-colors duration-150 ${
              isDragOver && isValidDropTarget ? 'text-primary-600 font-medium' : 'text-neutral-400'
            }`}
          >
            {isDragOver && isValidDropTarget ? (
              <span className="text-sm">Solte aqui</span>
            ) : (
              <>
                {column.emptyIcon}
                <span className="text-xs leading-snug">
                  {column.emptyLabel ?? emptyColumnLabel ?? 'Nenhum item'}
                </span>
              </>
            )}
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {cards.slice(0, visibleCount).map((card) => renderCard(card, buildHelpers(card)))}
            </AnimatePresence>
            {cards.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="w-full py-1.5 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded font-medium transition-colors"
              >
                Ver mais {cards.length - visibleCount} itens
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
