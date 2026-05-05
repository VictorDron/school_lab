import { User, Pencil, Trash2 } from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import { genderLabels, studentTypeLabels, formatAge } from '../helpers';

// ---------------------------------------------------------------------------
// ChildCardHeader — avatar, name, student type badge, age/gender summary,
// and the edit/delete action buttons. Action buttons render only when the
// surrounding tab grants edit permission.
// ---------------------------------------------------------------------------

export interface ChildCardHeaderProps {
  child: LeadChild;
  canEdit: boolean;
  onEdit: () => void;
  onRequestDelete: () => void;
}

export function ChildCardHeader({ child, canEdit, onEdit, onRequestDelete }: ChildCardHeaderProps) {
  const typeBadge = child.studentType ? studentTypeLabels[child.studentType] : undefined;

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-neutral-900">{child.fullName}</h4>
            {typeBadge && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge.color}`}>
                {typeBadge.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {child.dateOfBirth && <span>{formatAge(child.dateOfBirth)}</span>}
            {child.gender && genderLabels[child.gender] && (
              <>
                <span>•</span>
                <span>{genderLabels[child.gender]}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4 text-neutral-500" />
          </button>
          <button
            onClick={onRequestDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Remover"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}
