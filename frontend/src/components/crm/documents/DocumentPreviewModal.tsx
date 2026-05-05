import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type UnifiedDocument, isImageFile } from './utils';

interface DocumentPreviewModalProps {
  document: UnifiedDocument | null;
  onClose: () => void;
}

export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  if (!document || !isImageFile(document.name)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="relative max-w-4xl max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-10 right-0 text-white hover:text-neutral-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={document.url}
            alt={document.name}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
          />
          <div className="text-center mt-2 text-white text-sm">{document.name}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
