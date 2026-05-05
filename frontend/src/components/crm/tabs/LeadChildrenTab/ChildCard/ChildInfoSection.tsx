import {
  Calendar,
  GraduationCap,
  Building2,
  Languages,
  Globe,
  BookOpen,
} from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import { langLabel } from '../helpers';

// ---------------------------------------------------------------------------
// ChildInfoSection — renders the main info grid (desired/current grade, date
// of birth, nationality, current school), the languages strip when at least
// one language is set, and the special-needs callout when present.
// ---------------------------------------------------------------------------

export interface ChildInfoSectionProps {
  child: LeadChild;
}

export function ChildInfoSection({ child }: ChildInfoSectionProps) {
  const hasAnyLanguage = !!child.primaryLanguage || (child.otherLanguages?.length ?? 0) > 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {child.desiredGrade && (
          <div className="flex items-center gap-2 text-neutral-600">
            <GraduationCap className="w-4 h-4 text-neutral-400" />
            <span>
              Série desejada: <strong>{child.desiredGrade}</strong>
            </span>
          </div>
        )}

        {child.currentGrade && child.currentGrade !== child.desiredGrade && (
          <div className="flex items-center gap-2 text-neutral-600">
            <BookOpen className="w-4 h-4 text-neutral-400" />
            <span>Série atual: {child.currentGrade}</span>
          </div>
        )}

        {child.dateOfBirth && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span>{new Date(child.dateOfBirth).toLocaleDateString('pt-BR')}</span>
          </div>
        )}

        {child.nationality && (
          <div className="flex items-center gap-2 text-neutral-600">
            <Globe className="w-4 h-4 text-neutral-400" />
            <span>{child.nationality}</span>
          </div>
        )}

        {child.currentSchool && (
          <div className="flex items-center gap-2 text-neutral-600 col-span-2">
            <Building2 className="w-4 h-4 text-neutral-400" />
            <span>{child.currentSchool}</span>
          </div>
        )}
      </div>

      {hasAnyLanguage && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-sm">
            <Languages className="w-4 h-4 text-primary-500" />
            <span className="text-neutral-600">
              {child.primaryLanguage && (
                <span>
                  <strong>Idioma nativo:</strong> {langLabel(child.primaryLanguage)}
                </span>
              )}
              {child.otherLanguages && child.otherLanguages.length > 0 && (
                <span className="ml-2">
                  <strong>Outros:</strong> {child.otherLanguages.map(langLabel).join(', ')}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {child.specialNeeds && (
        <div className="mt-2 text-sm text-amber-700 bg-amber-50 rounded p-2">
          <strong>Necessidades especiais:</strong> {child.specialNeeds}
        </div>
      )}
    </>
  );
}
