import { Search, X } from 'lucide-react';
import type { ReEnrollmentGateStatus } from '@/lib/re-enrollment-transitions';

export interface KanbanFilters {
  search: string;
  grade: string | null;
  gate: ReEnrollmentGateStatus | null;
}

export const EMPTY_KANBAN_FILTERS: KanbanFilters = {
  search: '',
  grade: null,
  gate: null,
};

interface ReEnrollmentKanbanToolbarProps {
  filters: KanbanFilters;
  onChange: (next: KanbanFilters) => void;
  /** Grade values present in the current payload — drives the options */
  availableGrades: string[];
  totalCards: number;
  filteredCount: number;
}

const GATE_OPTIONS: { value: ReEnrollmentGateStatus; label: string }[] = [
  { value: 'CONVITE_ENVIADO', label: 'Convite enviado' },
  { value: 'FORMULARIO_CONFIRMADO', label: 'Formulário confirmado' },
  { value: 'DOCS_APROVADOS', label: 'Documentos aprovados' },
  { value: 'CONTRATO_PENDENTE', label: 'Contrato pendente' },
  { value: 'CONTRATO_ASSINADO', label: 'Contrato assinado' },
  { value: 'TAXA_PAGA', label: 'Taxa paga' },
  { value: 'REMATRICULADO', label: 'Rematriculado' },
  { value: 'RECUSADO', label: 'Recusado' },
];

export function ReEnrollmentKanbanToolbar({
  filters,
  onChange,
  availableGrades,
  totalCards,
  filteredCount,
}: ReEnrollmentKanbanToolbarProps) {
  const isFiltered =
    filters.search.trim().length > 0 || filters.grade !== null || filters.gate !== null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-white border-b border-neutral-200">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Buscar aluno por nome ou código..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <select
        value={filters.grade ?? ''}
        onChange={(e) => onChange({ ...filters, grade: e.target.value || null })}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Todas as séries</option>
        {availableGrades.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={filters.gate ?? ''}
        onChange={(e) =>
          onChange({ ...filters, gate: (e.target.value || null) as ReEnrollmentGateStatus | null })
        }
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Todas as etapas</option>
        {GATE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange(EMPTY_KANBAN_FILTERS)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
        >
          <X className="w-3 h-3" />
          Limpar filtros
        </button>
      )}

      <div className="ml-auto text-xs text-neutral-500">
        {isFiltered ? (
          <>
            Mostrando <span className="font-medium text-neutral-700">{filteredCount}</span>{' '}
            de {totalCards}
          </>
        ) : (
          <>
            {totalCards} {totalCards === 1 ? 'convite' : 'convites'}
          </>
        )}
      </div>
    </div>
  );
}
