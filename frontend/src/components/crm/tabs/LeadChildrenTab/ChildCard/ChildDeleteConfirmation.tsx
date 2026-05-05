import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// ChildDeleteConfirmation — inline animated panel that confirms the destroy
// action. Renders only while the confirmation is open; the open state is
// driven by the parent (the deletingId === child.id check is collapsed into
// a simple boolean prop here).
// ---------------------------------------------------------------------------

export interface ChildDeleteConfirmationProps {
  isOpen: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ChildDeleteConfirmation({ isOpen, isDeleting, onCancel, onConfirm }: ChildDeleteConfirmationProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-neutral-200"
        >
          <p className="text-sm text-neutral-600 mb-2">Remover este aluno?</p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="btn btn-secondary btn-sm">
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover'}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
