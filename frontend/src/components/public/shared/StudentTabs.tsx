import { User } from 'lucide-react';

interface StudentTabsProps {
  students: Array<{ fullName?: string }>;
  activeTab: number;
  onTabSwitch: (index: number) => void;
  language: string;
}

/** Horizontal scrollable tab selector for multi-child forms. Only renders when students.length > 1. */
export function StudentTabs({ students, activeTab, onTabSwitch, language }: StudentTabsProps) {
  if (students.length <= 1) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {students.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onTabSwitch(i)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === i
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          {s.fullName || `${language === 'pt' ? 'Aluno' : 'Student'} ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
