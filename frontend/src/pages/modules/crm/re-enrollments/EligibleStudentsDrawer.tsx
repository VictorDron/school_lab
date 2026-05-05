import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import EligibleStudentsTab from './EligibleStudentsTab';

interface EligibleStudentsDrawerProps {
  periodId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EligibleStudentsDrawer({
  periodId,
  isOpen,
  onClose,
}: EligibleStudentsDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-5xl bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  Enviar convites de rematrícula
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Selecione os alunos elegíveis e envie os convites em lote ou individualmente.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <EligibleStudentsTab periodId={periodId} onNavigateToInvites={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
