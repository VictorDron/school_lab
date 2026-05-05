import { MessageSquare } from 'lucide-react';
import { SidebarSection } from '../SidebarSection';

interface SidebarNotesProps {
  notes: string | null | undefined;
}

export function SidebarNotes({ notes }: SidebarNotesProps) {
  if (!notes) return null;

  return (
    <SidebarSection
      title="Notas"
      icon={<MessageSquare className="w-3.5 h-3.5 text-neutral-400" />}
      defaultOpen
    >
      <div className="bg-neutral-50 rounded p-2.5">
        <p className="text-xs text-neutral-600 whitespace-pre-wrap leading-relaxed">
          {notes}
        </p>
      </div>
    </SidebarSection>
  );
}
