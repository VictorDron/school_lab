import type { Dispatch, SetStateAction } from 'react';
import { CheckSquare, Plus } from 'lucide-react';

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

interface TaskCardChecklistsProps {
  checklists: Checklist[];
  newItemTexts: Record<string, string>;
  setNewItemTexts: Dispatch<SetStateAction<Record<string, string>>>;
  onToggleItem: (checklistId: string, itemId: string) => void;
  onAddItem: (checklistId: string) => void;
}

export function TaskCardChecklists({
  checklists,
  newItemTexts,
  setNewItemTexts,
  onToggleItem,
  onAddItem,
}: TaskCardChecklistsProps) {
  if (!checklists || checklists.length === 0) return null;

  return (
    <div className="space-y-4">
      {checklists
        .sort((a, b) => a.order - b.order)
        .map((checklist) => {
          const total = checklist.items.length;
          const done = checklist.items.filter((i) => i.isComplete).length;
          const progress = total > 0 ? (done / total) * 100 : 0;

          return (
            <div key={checklist.id}>
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-4 h-4 text-neutral-500" />
                <h4 className="text-sm font-semibold text-neutral-800 flex-1">
                  {checklist.title}
                </h4>
                <span className="text-xs text-neutral-500">
                  {done}/{total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-neutral-100 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress === 100 ? 'bg-green-500' : 'bg-primary-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Items */}
              <div className="space-y-1">
                {checklist.items
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-50 rounded-lg cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={item.isComplete}
                        onChange={() => onToggleItem(checklist.id, item.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-200"
                      />
                      <span
                        className={`text-sm flex-1 ${
                          item.isComplete
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-700'
                        }`}
                      >
                        {item.text}
                      </span>
                    </label>
                  ))}
              </div>

              {/* Add item */}
              <div className="flex items-center gap-2 mt-2 pl-2">
                <input
                  type="text"
                  value={newItemTexts[checklist.id] || ''}
                  onChange={(e) =>
                    setNewItemTexts((prev) => ({
                      ...prev,
                      [checklist.id]: e.target.value,
                    }))
                  }
                  placeholder="Adicionar item..."
                  className="flex-1 px-2 py-1 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onAddItem(checklist.id);
                  }}
                />
                <button
                  onClick={() => onAddItem(checklist.id)}
                  disabled={!newItemTexts[checklist.id]?.trim()}
                  className="p-1 text-primary-500 hover:bg-primary-50 rounded disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
