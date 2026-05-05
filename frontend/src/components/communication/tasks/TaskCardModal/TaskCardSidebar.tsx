import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  RotateCcw,
  Search,
  Tag,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import type { TaskLabel } from '@/types/communication';

interface Assignee {
  userId: string;
}

interface CardLabel {
  labelId: string;
}

interface DisplayUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface TaskCardSidebarProps {
  isCompleted: boolean;
  isCompletingPending: boolean;
  cardAssignees: Assignee[] | null | undefined;
  cardLabels: CardLabel[] | null | undefined;
  boardLabels: TaskLabel[];
  displayedUsers: DisplayUser[];
  members: {
    show: boolean;
    search: string;
    inputRef: RefObject<HTMLInputElement>;
    onToggle: () => void;
    onSearchChange: (value: string) => void;
    onToggleAssignee: (userId: string) => void;
  };
  labels: {
    show: boolean;
    onToggle: () => void;
    onToggleLabel: (label: TaskLabel) => void;
  };
  dueDate: {
    show: boolean;
    value: string;
    onToggle: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
    onClear: () => void;
  };
  checklist: {
    show: boolean;
    title: string;
    onOpen: () => void;
    onClose: () => void;
    onTitleChange: (value: string) => void;
    onCreate: () => void;
  };
  onComplete: () => void;
}

export function TaskCardSidebar({
  isCompleted,
  isCompletingPending,
  cardAssignees,
  cardLabels,
  boardLabels,
  displayedUsers,
  members,
  labels,
  dueDate,
  checklist,
  onComplete,
}: TaskCardSidebarProps) {
  return (
    <div className="w-full md:w-56 p-4 space-y-2 flex-shrink-0">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        Acoes
      </p>

      {/* Members */}
      <div className="relative">
        <button
          onClick={members.onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          <Users className="w-4 h-4" />
          Membros
        </button>

        <AnimatePresence>
          {members.show && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20"
            >
              <div className="p-2 border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    ref={members.inputRef}
                    type="text"
                    value={members.search}
                    onChange={(e) => members.onSearchChange(e.target.value)}
                    placeholder="Buscar usuário..."
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-200"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {displayedUsers.map((u) => {
                  const isAssigned = cardAssignees?.some((a) => a.userId === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => members.onToggleAssignee(u.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 text-sm"
                    >
                      <Avatar src={u.avatarUrl ?? undefined} name={u.displayName} size="xs" />
                      <div className="flex-1 text-left min-w-0">
                        <span className="block truncate font-medium text-neutral-800">
                          {u.displayName}
                        </span>
                        <span className="block truncate text-xs text-neutral-400">
                          {u.email}
                        </span>
                      </div>
                      {isAssigned && <Check className="w-4 h-4 text-primary-500 flex-shrink-0" />}
                    </button>
                  );
                })}
                {displayedUsers.length === 0 && (
                  <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                    {members.search ? 'Nenhum usuário encontrado' : 'Nenhum usuário'}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Labels */}
      <div className="relative">
        <button
          onClick={labels.onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          <Tag className="w-4 h-4" />
          Etiquetas
        </button>

        <AnimatePresence>
          {labels.show && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto"
            >
              {boardLabels.map((label) => {
                const hasLabel = cardLabels?.some((l) => l.labelId === label.id);
                return (
                  <button
                    key={label.id}
                    onClick={() => labels.onToggleLabel(label)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 text-sm"
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: label.color }} />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                    {hasLabel && <Check className="w-4 h-4 text-primary-500" />}
                  </button>
                );
              })}
              {boardLabels.length === 0 && (
                <div className="px-3 py-4 text-sm text-neutral-400 text-center">
                  Nenhuma etiqueta
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Due Date */}
      <div className="relative">
        <button
          onClick={dueDate.onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Data de entrega
        </button>

        <AnimatePresence>
          {dueDate.show && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 p-3"
            >
              <input
                type="date"
                value={dueDate.value}
                onChange={(e) => dueDate.onChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={dueDate.onSave}
                  className="flex-1 px-2 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600"
                >
                  Salvar
                </button>
                <button
                  onClick={dueDate.onClear}
                  className="px-2 py-1 text-neutral-600 hover:bg-neutral-100 rounded text-xs"
                >
                  Limpar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checklist */}
      <div>
        {checklist.show ? (
          <div className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
            <input
              type="text"
              value={checklist.title}
              onChange={(e) => checklist.onTitleChange(e.target.value)}
              placeholder="Titulo da checklist..."
              className="w-full px-2 py-1.5 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-200"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') checklist.onCreate();
                if (e.key === 'Escape') checklist.onClose();
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={checklist.onCreate}
                disabled={!checklist.title.trim()}
                className="px-2 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                Criar
              </button>
              <button
                onClick={checklist.onClose}
                className="px-2 py-1 text-neutral-600 hover:bg-neutral-100 rounded text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={checklist.onOpen}
            className="w-full flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            Checklist
          </button>
        )}
      </div>

      <div className="border-t border-neutral-100 pt-2 mt-3 space-y-2">
        {/* Complete / Reopen */}
        <button
          onClick={onComplete}
          disabled={isCompletingPending}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isCompleted
              ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {isCompleted ? (
            <>
              <RotateCcw className="w-4 h-4" />
              Reabrir
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Concluir
            </>
          )}
        </button>

        {/* Archive */}
        <button
          onClick={() => toast.success('Funcionalidade em desenvolvimento')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
        >
          <Archive className="w-4 h-4" />
          Arquivar
        </button>
      </div>
    </div>
  );
}
