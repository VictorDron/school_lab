import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function SidebarSection({ title, icon, defaultOpen = true, count, children, actions }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-neutral-50 transition-colors rounded"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          {icon}
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
