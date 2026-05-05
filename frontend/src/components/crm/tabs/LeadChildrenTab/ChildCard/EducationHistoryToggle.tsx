import { motion, AnimatePresence } from 'framer-motion';
import { School } from 'lucide-react';
import type { LeadEducationHistory } from '@/types/crm';
import { EducationHistorySection } from '../EducationHistorySection';

// ---------------------------------------------------------------------------
// EducationHistoryToggle — show/hide button paired with the animated
// education history panel. Renders nothing when the child has no history
// records so the parent doesn't need to guard the call.
// ---------------------------------------------------------------------------

export interface EducationHistoryToggleProps {
  history: LeadEducationHistory[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function EducationHistoryToggle({ history, isExpanded, onToggle }: EducationHistoryToggleProps) {
  if (history.length === 0) return null;

  return (
    <>
      <button
        onClick={onToggle}
        className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
      >
        <School className="w-3.5 h-3.5" />
        {isExpanded ? 'Ocultar' : 'Ver'} histórico educacional ({history.length})
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <EducationHistorySection history={history} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
