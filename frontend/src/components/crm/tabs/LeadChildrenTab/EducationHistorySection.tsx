import { School, MapPin } from 'lucide-react';
import type { LeadEducationHistory } from '@/types/crm';

interface EducationHistorySectionProps {
  history: LeadEducationHistory[];
}

export function EducationHistorySection({ history }: EducationHistorySectionProps) {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-neutral-200">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
        <School className="w-3.5 h-3.5" />
        Histórico Educacional
      </p>
      <div className="space-y-2">
        {history.map((edu) => (
          <div key={edu.id} className="bg-neutral-50 rounded-lg p-3 text-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-neutral-900">{edu.schoolName}</p>
                {(edu.city || edu.country) && (
                  <p className="text-neutral-500 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[edu.city, edu.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              {(edu.yearStart || edu.yearEnd) && (
                <span className="text-xs text-neutral-500">
                  {edu.yearStart}
                  {edu.yearEnd && edu.yearEnd !== edu.yearStart ? ` - ${edu.yearEnd}` : ''}
                </span>
              )}
            </div>
            {edu.gradesAttended && (
              <p className="text-neutral-600 text-xs mt-1">Séries: {edu.gradesAttended}</p>
            )}
            {edu.notes && (
              <p className="text-neutral-500 text-xs mt-1 italic">{edu.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
