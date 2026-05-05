import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import type { UnifiedDocument } from './utils';
import { documentCategories } from './constants';
import { DocumentChecklistItem } from './DocumentChecklistItem';

interface DocumentChecklistProps {
  documents: UnifiedDocument[];
  children: LeadChild[];
}

export function DocumentChecklist({ documents, children }: DocumentChecklistProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['REQUIRED']);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(documentCategories).map(([key, category]) => {
        const uploadedCount = category.types.filter((t) => documents.some((d) => d.type === t.value)).length;

        return (
          <div key={key} className="border border-neutral-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleCategory(key)}
              className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedCategories.includes(key) ? (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                )}
                <span className="font-medium text-neutral-900">{category.label}</span>
                <span className="text-xs text-neutral-500">
                  {uploadedCount}/{category.types.length}
                </span>
              </div>
              {uploadedCount > 0 && (
                <div className="h-1.5 w-16 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(uploadedCount / category.types.length) * 100}%` }}
                  />
                </div>
              )}
            </button>
            <AnimatePresence>
              {expandedCategories.includes(key) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 space-y-2 bg-white">
                    <p className="text-xs text-neutral-500 mb-3">{category.description}</p>
                    {category.types.map((type) => (
                      <DocumentChecklistItem
                        key={type.value}
                        type={type}
                        documents={documents}
                        children={children}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
