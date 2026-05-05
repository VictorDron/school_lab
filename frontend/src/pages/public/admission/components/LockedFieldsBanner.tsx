import { Lock } from 'lucide-react';
import { SOURCE_LABELS } from '@/components/public/admission/types';
import type { AdmissionLanguage, AdmissionTranslations } from '../translations';

interface LockedFields {
  desiredGrade: boolean;
  source: boolean;
}

interface LockedFieldsBannerProps {
  lockedFields: LockedFields;
  desiredGrade: string | undefined;
  source: string | undefined;
  language: AdmissionLanguage;
  t: AdmissionTranslations;
}

export function LockedFieldsBanner({
  lockedFields,
  desiredGrade,
  source,
  language,
  t,
}: LockedFieldsBannerProps) {
  if (!lockedFields.desiredGrade && !lockedFields.source) return null;

  const sourceLabel = source
    ? SOURCE_LABELS[source]?.[language === 'pt' ? 'pt' : 'en'] || source
    : null;

  return (
    <div className="mb-6 bg-primary-50 border border-primary-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-800 mb-2">{t.lockedBySchool}</p>
          <div className="flex flex-wrap gap-4">
            {lockedFields.desiredGrade && desiredGrade && (
              <div className="text-sm">
                <span className="text-primary-600">{t.desiredGrade}:</span>{' '}
                <span className="font-medium text-primary-900">{desiredGrade}</span>
              </div>
            )}
            {lockedFields.source && sourceLabel && (
              <div className="text-sm">
                <span className="text-primary-600">{t.source}:</span>{' '}
                <span className="font-medium text-primary-900">{sourceLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
