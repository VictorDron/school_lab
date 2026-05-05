import type { RefObject } from 'react';
import { X } from 'lucide-react';

interface TaskCardHeaderProps {
  cardTitle: string;
  cardCode: string;
  columnName?: string;
  isCompleted: boolean;
  editingTitle: boolean;
  titleValue: string;
  titleInputRef: RefObject<HTMLInputElement>;
  onTitleChange: (value: string) => void;
  onStartEditingTitle: () => void;
  onSaveTitle: () => void;
  onCancelTitleEdit: () => void;
  onClose: () => void;
}

export function TaskCardHeader({
  cardTitle,
  cardCode,
  columnName,
  isCompleted,
  editingTitle,
  titleValue,
  titleInputRef,
  onTitleChange,
  onStartEditingTitle,
  onSaveTitle,
  onCancelTitleEdit,
  onClose,
}: TaskCardHeaderProps) {
  return (
    <div className="flex items-start justify-between p-4 border-b border-neutral-200">
      <div className="flex-1 min-w-0 mr-4">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={titleValue}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveTitle();
              if (e.key === 'Escape') onCancelTitleEdit();
            }}
            className="w-full text-lg font-semibold border border-neutral-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-200"
            autoFocus
          />
        ) : (
          <h2
            onClick={onStartEditingTitle}
            className={`text-lg font-semibold cursor-pointer hover:bg-neutral-50 rounded px-2 py-1 -mx-2 ${
              isCompleted ? 'line-through text-neutral-500' : 'text-neutral-900'
            }`}
          >
            {cardTitle}
          </h2>
        )}
        <div className="flex items-center gap-2 mt-1 px-2 text-xs text-neutral-500">
          <span className="font-mono">{cardCode}</span>
          {columnName && (
            <>
              <span>em</span>
              <span className="font-medium text-neutral-700">{columnName}</span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
