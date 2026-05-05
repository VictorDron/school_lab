import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { StudentFilters } from '@/types/students';

interface AdvancedFiltersProps {
  filters: StudentFilters;
  onChange: (key: keyof StudentFilters, value: string | number | undefined) => void;
  onClear: () => void;
}

export function AdvancedFilters({ filters, onChange, onClear }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    !!filters.parentName ||
    !!filters.enrolledAfter ||
    !!filters.enrolledBefore ||
    filters.ageMin != null ||
    filters.ageMax != null;

  return (
    <div className="bg-neutral-50 rounded-xl border border-neutral-200 transition-all duration-200">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-700 hover:text-neutral-900"
      >
        <span className="flex items-center gap-2">
          Filtros Avançados
          {hasActiveFilters && (
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-violet-500" />
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Responsável */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={filters.parentName || ''}
                onChange={(e) => onChange('parentName', e.target.value || undefined)}
                placeholder="Nome do responsável..."
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Matriculado após */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Matriculado após
              </label>
              <input
                type="date"
                value={filters.enrolledAfter || ''}
                onChange={(e) => onChange('enrolledAfter', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Matriculado antes */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Matriculado antes
              </label>
              <input
                type="date"
                value={filters.enrolledBefore || ''}
                onChange={(e) => onChange('enrolledBefore', e.target.value || undefined)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Idade mínima */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Idade mínima
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={filters.ageMin ?? ''}
                onChange={(e) =>
                  onChange('ageMin', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>

            {/* Idade máxima */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Idade máxima
              </label>
              <input
                type="number"
                min={0}
                max={25}
                value={filters.ageMax ?? ''}
                onChange={(e) =>
                  onChange('ageMax', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="25"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar Filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
