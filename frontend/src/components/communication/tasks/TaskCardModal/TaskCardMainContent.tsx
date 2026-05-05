import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Calendar } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDueDateStyle } from './helpers';
import { TaskCardChecklists } from './TaskCardChecklists';
import { TaskCardComments } from './TaskCardComments';

interface LabelRef {
  id: string;
  label: { color: string; name: string };
}

interface ChecklistItem {
  id: string;
  text: string;
  isComplete: boolean;
  order: number;
}

interface Checklist {
  id: string;
  title: string;
  order: number;
  items: ChecklistItem[];
}

interface ActivityEntry {
  id: string;
  action: string;
  createdAt: string;
}

interface CardForMainContent {
  status?: string;
  dueDate?: string | null;
  description?: string | null;
  labels?: LabelRef[] | null;
  checklists?: Checklist[] | null;
  activity?: ActivityEntry[] | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { avatarUrl?: string | null; displayName: string };
}

interface CurrentUser {
  avatarUrl?: string | null;
  displayName: string;
}

interface TaskCardMainContentProps {
  card: CardForMainContent;
  isCompleted: boolean;
  description: {
    editing: boolean;
    value: string;
    isSaving: boolean;
    onChange: (value: string) => void;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
  };
  checklists: {
    newItemTexts: Record<string, string>;
    setNewItemTexts: Dispatch<SetStateAction<Record<string, string>>>;
    onToggleItem: (checklistId: string, itemId: string) => void;
    onAddItem: (checklistId: string) => void;
  };
  comments: {
    list: Comment[];
    currentUser?: CurrentUser | null;
    text: string;
    isSubmitting: boolean;
    endRef: RefObject<HTMLDivElement>;
    onTextChange: (value: string) => void;
    onAdd: () => void;
  };
}

export function TaskCardMainContent({
  card,
  isCompleted,
  description,
  checklists,
  comments,
}: TaskCardMainContentProps) {
  return (
    <div className="flex-1 p-4 space-y-5 min-w-0 md:border-r md:border-neutral-100">
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Etiquetas
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {card.labels.map((labelRef) => (
              <span
                key={labelRef.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: labelRef.label.color }}
              >
                {labelRef.label.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Due Date */}
      {card.dueDate && (
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${getDueDateStyle(card)}`} />
          <span className={`text-sm font-medium ${getDueDateStyle(card)}`}>
            {format(new Date(card.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
          {isCompleted && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              Concluido
            </span>
          )}
          {!isCompleted && card.dueDate && isPast(new Date(card.dueDate)) && !isToday(new Date(card.dueDate)) && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
              Atrasado
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Descrição
        </h4>
        {description.editing ? (
          <div>
            <textarea
              value={description.value}
              onChange={(e) => description.onChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 resize-y"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={description.onSave}
                disabled={description.isSaving}
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                onClick={description.onCancel}
                className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={description.onStartEdit}
            className="min-h-[60px] px-3 py-2 bg-neutral-50 rounded-lg text-sm text-neutral-700 cursor-pointer hover:bg-neutral-100 transition-colors whitespace-pre-wrap"
          >
            {card.description || (
              <span className="text-neutral-400 italic">
                Clique para adicionar uma descricao...
              </span>
            )}
          </div>
        )}
      </div>

      <TaskCardChecklists
        checklists={card.checklists || []}
        newItemTexts={checklists.newItemTexts}
        setNewItemTexts={checklists.setNewItemTexts}
        onToggleItem={checklists.onToggleItem}
        onAddItem={checklists.onAddItem}
      />

      <TaskCardComments
        comments={comments.list}
        currentUser={comments.currentUser}
        commentText={comments.text}
        isSubmitting={comments.isSubmitting}
        commentsEndRef={comments.endRef}
        onCommentTextChange={comments.onTextChange}
        onAddComment={comments.onAdd}
      />

      {/* Activity */}
      {card.activity && card.activity.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            Atividade
          </h4>
          <div className="space-y-2">
            {card.activity.slice(0, 10).map((act) => (
              <div key={act.id} className="flex items-center gap-2 text-xs text-neutral-500">
                <div className="w-1.5 h-1.5 bg-neutral-300 rounded-full flex-shrink-0" />
                <span className="flex-1">{act.action}</span>
                <span>
                  {formatDistanceToNow(new Date(act.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
