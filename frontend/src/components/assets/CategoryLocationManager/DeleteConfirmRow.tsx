import { Loader2, Check, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// DeleteConfirmRow — replaces the trailing edit/delete icon pair with a
// "Confirmar?" prompt plus check/cancel actions while a delete is pending
// confirmation. Same pattern is used by both categories and locations.
// ---------------------------------------------------------------------------

export interface DeleteConfirmRowProps {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmRow({ isDeleting, onConfirm, onCancel }: DeleteConfirmRowProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-red-600 mr-1">Confirmar?</span>
      <button
        onClick={onConfirm}
        disabled={isDeleting}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button
        onClick={onCancel}
        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
