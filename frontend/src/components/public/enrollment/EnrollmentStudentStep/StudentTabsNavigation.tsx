import { User } from 'lucide-react';

// ---------------------------------------------------------------------------
// StudentTabsNavigation — horizontal tab strip rendered only when the
// enrollment covers more than one child. Each tab swaps which student's
// data the surrounding form sections operate on.
// ---------------------------------------------------------------------------

export interface StudentTabsNavigationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentStudents: any[];
  activeStudentTab: number;
  onTabSwitch: (tab: number) => void;
  language: string;
}

export function StudentTabsNavigation({
  enrollmentStudents,
  activeStudentTab,
  onTabSwitch,
  language,
}: StudentTabsNavigationProps) {
  if (enrollmentStudents.length <= 1) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {enrollmentStudents.map((s, i: number) => (
        <button
          key={i}
          type="button"
          onClick={() => onTabSwitch(i)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeStudentTab === i
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          {s.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
