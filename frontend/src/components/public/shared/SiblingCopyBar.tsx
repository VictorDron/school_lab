import type { ComponentType } from 'react';
import { Copy } from 'lucide-react';

interface SiblingCopyBarProps {
  students: Array<{ fullName?: string }>;
  activeTab: number;
  onCopy: (sourceIndex: number) => void;
  language: string;
  /** Optional icon to show before the label. Defaults to Copy. */
  icon?: ComponentType<{ className?: string }>;
}

/**
 * "Copy data from sibling" selector. Renders a dropdown with siblings
 * (excluding the active tab). Only renders when students.length > 1.
 */
export function SiblingCopyBar({ students, activeTab, onCopy, language, icon }: SiblingCopyBarProps) {
  if (students.length <= 1) return null;

  const Icon = icon || Copy;

  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-800 whitespace-nowrap">
        {language === 'pt' ? 'Copiar dados de:' : 'Copy data from:'}
      </span>
      <select
        className="input py-1.5 text-sm flex-1 max-w-xs"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value !== '') {
            onCopy(Number(e.target.value));
            e.target.value = '';
          }
        }}
      >
        <option value="">
          {language === 'pt' ? 'Selecione um irmão...' : 'Select a sibling...'}
        </option>
        {students.map((s, i) =>
          i !== activeTab ? (
            <option key={i} value={i}>
              {s.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`}
            </option>
          ) : null
        )}
      </select>
    </div>
  );
}
