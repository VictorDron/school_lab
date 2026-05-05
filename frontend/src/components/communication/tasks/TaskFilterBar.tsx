import { Search, X, Calendar, User, Tag } from 'lucide-react';
import { useBoardMembers, useBoardLabels } from '@/hooks/useTaskBoards';

interface TaskFilters {
  search: string;
  assigneeId: string;
  labelId: string;
  dueDateFilter: '' | 'overdue' | 'thisWeek' | 'noDueDate';
}

interface TaskFilterBarProps {
  boardId: string;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export default function TaskFilterBar({ boardId, filters, onFiltersChange }: TaskFilterBarProps) {
  const { data: members = [] } = useBoardMembers(boardId);
  const { data: labels = [] } = useBoardLabels(boardId);

  const hasActiveFilters =
    filters.search || filters.assigneeId || filters.labelId || filters.dueDateFilter;

  const updateFilter = (key: keyof TaskFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({ search: '', assigneeId: '', labelId: '', dueDateFilter: '' });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-neutral-50 border-b border-neutral-200 flex-wrap">
      {/* Search */}
      <div className="relative flex-shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Buscar cartoes..."
          className="pl-8 pr-3 py-1.5 w-48 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
        />
      </div>

      {/* Assignee */}
      <div className="relative flex-shrink-0">
        <select
          value={filters.assigneeId}
          onChange={(e) => updateFilter('assigneeId', e.target.value)}
          className="pl-8 pr-6 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer"
        >
          <option value="">Todos os membros</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.user.displayName}
            </option>
          ))}
        </select>
        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
      </div>

      {/* Label */}
      <div className="relative flex-shrink-0">
        <select
          value={filters.labelId}
          onChange={(e) => updateFilter('labelId', e.target.value)}
          className="pl-8 pr-6 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 appearance-none cursor-pointer"
        >
          <option value="">Todas as etiquetas</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
      </div>

      {/* Due Date Quick Filters */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Calendar className="w-3.5 h-3.5 text-neutral-400 mr-1" />
        {[
          { value: 'overdue' as const, label: 'Atrasadas' },
          { value: 'thisWeek' as const, label: 'Esta semana' },
          { value: 'noDueDate' as const, label: 'Sem data' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() =>
              updateFilter(
                'dueDateFilter',
                filters.dueDateFilter === option.value ? '' : option.value
              )
            }
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              filters.dueDateFilter === option.value
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
