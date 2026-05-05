import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// SectionHeader — top bar of either the Categories or Locations panel.
// Carries the section icon, title, count badge, and the "Adicionar" button.
// ---------------------------------------------------------------------------

export interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  count: number;
  onAddClick: () => void;
}

export function SectionHeader({ icon: Icon, title, count, onAddClick }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary-500" />
        <h3 className="text-base font-semibold text-neutral-800">{title}</h3>
        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <button onClick={onAddClick} className="btn btn-primary btn-sm">
        <Plus className="w-4 h-4 mr-1" />
        Adicionar
      </button>
    </div>
  );
}
