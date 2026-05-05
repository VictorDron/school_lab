import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  BarChart3,
  Settings,
  LayoutGrid,
  List,
} from 'lucide-react';
import { StatCard } from '../StatCard';
import {
  ReEnrollmentKanbanToolbar,
  type KanbanFilters,
} from './kanban/ReEnrollmentKanbanToolbar';
import type { ReEnrollmentKanbanCard } from '@/types/re-enrollment-kanban';
import type { ReEnrollmentPeriodFull } from '@/types/re-enrollment';

export type ReEnrollmentViewMode = 'kanban' | 'list';

interface ReEnrollmentHeaderProps {
  periods: ReEnrollmentPeriodFull[];
  selectedPeriodId: string | null;
  onPeriodChange: (id: string | null) => void;
  periodsLoading: boolean;
  cards: ReEnrollmentKanbanCard[];
  filteredCount: number;
  filters: KanbanFilters;
  onFiltersChange: (next: KanbanFilters) => void;
  availableGrades: string[];
  viewMode: ReEnrollmentViewMode;
  onViewModeChange: (mode: ReEnrollmentViewMode) => void;
  onNewInviteClick: () => void;
  totalEligible?: number;
}

const TERMINAL_STATUSES = new Set(['REMATRICULADO', 'RECUSADO']);

function computeStats(cards: ReEnrollmentKanbanCard[]) {
  let pending = 0;
  let confirmed = 0;
  let overdue = 0;

  for (const c of cards) {
    if (c.gateStatus === 'TAXA_PAGA' || c.gateStatus === 'REMATRICULADO') {
      confirmed++;
    } else if (!TERMINAL_STATUSES.has(c.gateStatus)) {
      pending++;
    }
    if (c.overdue) overdue++;
  }

  return { total: cards.length, pending, confirmed, overdue };
}

export function ReEnrollmentHeader({
  periods,
  selectedPeriodId,
  onPeriodChange,
  periodsLoading,
  cards,
  filteredCount,
  filters,
  onFiltersChange,
  availableGrades,
  viewMode,
  onViewModeChange,
  onNewInviteClick,
  totalEligible,
}: ReEnrollmentHeaderProps) {
  const navigate = useNavigate();
  const stats = computeStats(cards);

  const handleNewInvite = () => {
    if (selectedPeriodId) onNewInviteClick();
  };

  const handleDashboard = () => {
    if (selectedPeriodId) {
      navigate(`/crm/re-enrollments/${selectedPeriodId}/dashboard`);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200">
      {/* Title row */}
      <div className="px-6 pt-4 pb-3 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Rematrículas</h1>
          <p className="text-sm text-neutral-500">
            Gerencie a campanha ativa: convites, documentos, contratos e taxa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            id="period-selector"
            aria-label="Selecionar campanha"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedPeriodId ?? ''}
            onChange={(e) => onPeriodChange(e.target.value || null)}
            disabled={periodsLoading || periods.length === 0}
          >
            {periods.length === 0 ? (
              <option value="">Nenhuma campanha disponível</option>
            ) : (
              periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.status}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={() => navigate('/crm/re-enrollments/periods')}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <Settings className="w-4 h-4" />
            Gerenciar campanhas
          </button>
        </div>
      </div>

      {/* Stats + actions row */}
      <div className="px-6 py-3 border-t border-neutral-100 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <StatCard
            label={totalEligible ? 'Convites enviados' : 'Total de convites'}
            value={totalEligible ?? stats.total}
            filteredValue={totalEligible ? stats.total : undefined}
            icon={<Users className="w-4 h-4" />}
            color="blue"
          />
          <StatCard
            label="Pendentes"
            value={stats.pending}
            icon={<Clock className="w-4 h-4" />}
            color="amber"
          />
          <StatCard
            label="Confirmados"
            value={stats.confirmed}
            icon={<CheckCircle className="w-4 h-4" />}
            color="green"
          />
          <StatCard
            label="Vencidos"
            value={stats.overdue}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="purple"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex rounded-md border border-neutral-300 overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange('kanban')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
              aria-pressed={viewMode === 'kanban'}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border-l border-neutral-300 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
          </div>

          <button
            type="button"
            onClick={handleDashboard}
            disabled={!selectedPeriodId}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={handleNewInvite}
            disabled={!selectedPeriodId}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Novo convite
          </button>
        </div>
      </div>

      {/* Filters row — only relevant when there's data to filter */}
      {cards.length > 0 && (
        <ReEnrollmentKanbanToolbar
          filters={filters}
          onChange={onFiltersChange}
          availableGrades={availableGrades}
          totalCards={cards.length}
          filteredCount={filteredCount}
        />
      )}
    </header>
  );
}
