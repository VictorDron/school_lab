import clsx from 'clsx';
import type { FilterTab } from './types';

interface FilterTabsProps {
  activeFilter: FilterTab;
  setActiveFilter: (tab: FilterTab) => void;
  totalCount: number;
  admissionCount: number;
  enrollmentCount: number;
}

export function FilterTabs({
  activeFilter,
  setActiveFilter,
  totalCount,
  admissionCount,
  enrollmentCount,
}: FilterTabsProps) {
  const tabs = [
    { key: 'all' as const, label: 'Todos', count: totalCount },
    { key: 'admission' as const, label: 'Admissão', count: admissionCount },
    { key: 'enrollment' as const, label: 'Matrícula', count: enrollmentCount },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-neutral-200">
      {tabs.map((tab) => {
        const active = activeFilter === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={clsx(
              'px-3 py-2 text-sm font-medium border-b-2 transition-colors',
              active
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700',
            )}
          >
            {tab.label}
            <span
              className={clsx(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                active ? 'bg-violet-100 text-violet-700' : 'bg-neutral-100 text-neutral-500',
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
