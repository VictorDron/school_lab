import { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Check, X, Pencil, Palette, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TaskColumn as TaskColumnType } from '@/types/communication';
import { useCreateCard } from '@/hooks/useTaskCards';
import TaskCard from './TaskCard';

interface TaskColumnProps {
  column: TaskColumnType;
  boardId: string;
  onCardClick: (cardId: string) => void;
}

const COLUMN_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6b7280',
];

export default function TaskColumn({ column, boardId, onCardClick }: TaskColumnProps) {
  const createCard = useCreateCard();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const cards = (column.cards || []).sort((a, b) => a.order - b.order);
  const cardIds = cards.map((c) => c.id);

  const isOverLimit = column.limit ? cards.length > column.limit : false;

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;
    try {
      await createCard.mutateAsync({
        boardId,
        columnId: column.id,
        title: newCardTitle.trim(),
      });
      setNewCardTitle('');
      setAddingCard(false);
    } catch {
      toast.error('Erro ao criar cartao');
    }
  };

  const handleRename = () => {
    // In a real implementation this would call an updateColumn hook
    setEditingName(false);
    toast.success('Funcionalidade em desenvolvimento');
  };

  const handleDelete = () => {
    setShowMenu(false);
    toast.success('Funcionalidade em desenvolvimento');
  };

  return (
    <div
      className={`w-72 flex-shrink-0 flex flex-col max-h-full rounded-xl transition-colors ${
        isOver ? 'bg-primary-50/60' : 'bg-neutral-100/60'
      }`}
    >
      {/* Column Header */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: column.color || '#6b7280' }}
        />

        {editingName ? (
          <div className="flex-1 flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-2 py-0.5 text-sm font-semibold border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditingName(false);
              }}
            />
            <button onClick={handleRename} className="p-0.5 hover:bg-neutral-200 rounded">
              <Check className="w-3.5 h-3.5 text-primary-600" />
            </button>
            <button onClick={() => setEditingName(false)} className="p-0.5 hover:bg-neutral-200 rounded">
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-semibold text-neutral-800 truncate">
            {column.name}
          </span>
        )}

        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
            isOverLimit
              ? 'bg-red-100 text-red-700'
              : 'bg-neutral-200/80 text-neutral-600'
          }`}
        >
          {cards.length}
          {column.limit ? `/${column.limit}` : ''}
        </span>

        {/* Column Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-neutral-200/80 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-neutral-200 z-50 py-1"
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setEditingName(true);
                      setEditName(column.name);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Renomear
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      toast.success('Funcionalidade em desenvolvimento');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    <Palette className="w-3.5 h-3.5" />
                    Alterar cor
                  </button>
                  <div className="border-t border-neutral-100 my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir coluna
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Cards List */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px] transition-colors rounded-b-xl ${
          isOver ? 'bg-primary-50/40' : ''
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <TaskCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </SortableContext>

        {/* Empty column state */}
        {cards.length === 0 && !addingCard && (
          <div className="flex items-center justify-center py-8 text-neutral-400 text-sm">
            Nenhum cartao
          </div>
        )}

        {/* Add Card Inline Form */}
        <AnimatePresence>
          {addingCard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-lg border border-neutral-200 p-2 shadow-sm">
                <textarea
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  placeholder="Titulo do cartao..."
                  rows={2}
                  className="w-full px-2 py-1.5 text-sm border-none focus:outline-none resize-none placeholder:text-neutral-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCreateCard();
                    }
                    if (e.key === 'Escape') {
                      setAddingCard(false);
                      setNewCardTitle('');
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleCreateCard}
                    disabled={!newCardTitle.trim() || createCard.isPending}
                    className="px-3 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {createCard.isPending ? 'Criando...' : 'Adicionar'}
                  </button>
                  <button
                    onClick={() => {
                      setAddingCard(false);
                      setNewCardTitle('');
                    }}
                    className="p-1 hover:bg-neutral-100 rounded text-neutral-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Card Button */}
      {!addingCard && (
        <button
          onClick={() => setAddingCard(true)}
          className="mx-2 mb-2 flex items-center gap-1.5 px-3 py-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar Cartao
        </button>
      )}
    </div>
  );
}
