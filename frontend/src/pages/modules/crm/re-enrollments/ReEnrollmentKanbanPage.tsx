import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useEligibleStudents, useReEnrollmentPeriods } from '@/hooks/useReEnrollmentAdmin';
import { useReEnrollmentKanbanView } from '@/hooks/useReEnrollmentKanban';
import { ReEnrollmentKanbanView } from './kanban/ReEnrollmentKanbanView';
import { ReEnrollmentListView } from './list/ReEnrollmentListView';
import { ReEnrollmentHeader, type ReEnrollmentViewMode } from './ReEnrollmentHeader';
import { ReEnrollmentPendenciesWidget } from './components/ReEnrollmentPendenciesWidget';
import EligibleStudentsDrawer from './EligibleStudentsDrawer';
import { EMPTY_KANBAN_FILTERS, type KanbanFilters } from './kanban/ReEnrollmentKanbanToolbar';
import type { ReEnrollmentKanbanCard } from '@/types/re-enrollment-kanban';

/**
 * Default view at /crm/re-enrollments. Mirrors the matrículas surface:
 * stats + view toggle + pendências widget + kanban or list of the active
 * campaign. Period CRUD lives one click away under /crm/re-enrollments/periods,
 * and the per-campaign Dashboard / Gestão pages are reachable via the header
 * action buttons.
 */
export default function ReEnrollmentKanbanPage() {
  const { data: periodsResponse, isLoading: periodsLoading } = useReEnrollmentPeriods();
  const periods = periodsResponse?.data ?? [];

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ReEnrollmentViewMode>('kanban');
  const [isEligibleDrawerOpen, setIsEligibleDrawerOpen] = useState(false);

  const { data: eligibleResponse } = useEligibleStudents(selectedPeriodId);
  const totalEligible = useMemo(() => {
    if (!eligibleResponse) return undefined;
    const meta = eligibleResponse.meta as { alreadyInvited?: number } | undefined;
    const remaining = eligibleResponse.data?.length ?? 0;
    const alreadyInvited = meta?.alreadyInvited ?? 0;
    return alreadyInvited + remaining;
  }, [eligibleResponse]);

  const defaultPeriodId = useMemo(() => {
    if (periods.length === 0) return null;
    const open = periods.find((p) => p.status === 'OPEN');
    return open?.id ?? periods[0].id;
  }, [periods]);

  useEffect(() => {
    if (selectedPeriodId === null && defaultPeriodId) {
      setSelectedPeriodId(defaultPeriodId);
    }
  }, [defaultPeriodId, selectedPeriodId]);

  const { data: kanbanResponse, isLoading: kanbanLoading, isError: kanbanError, error } =
    useReEnrollmentKanbanView(selectedPeriodId);
  const payload = kanbanResponse?.data;

  const [filters, setFilters] = useState<KanbanFilters>(EMPTY_KANBAN_FILTERS);

  // Reset filters whenever the selected period changes — a search typed
  // for one campaign is irrelevant on another.
  useEffect(() => {
    setFilters(EMPTY_KANBAN_FILTERS);
  }, [selectedPeriodId]);

  const availableGrades = useMemo(() => {
    if (!payload) return [] as string[];
    const unique = new Set<string>();
    for (const c of payload.cards) if (c.grade) unique.add(c.grade);
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [payload]);

  const filterPredicate = useCallback(
    (card: ReEnrollmentKanbanCard) => {
      if (filters.gate && card.gateStatus !== filters.gate) return false;
      if (filters.grade && card.grade !== filters.grade) return false;
      if (filters.search.trim().length > 0) {
        const q = filters.search.trim().toLowerCase();
        const matches =
          card.studentName.toLowerCase().includes(q) ||
          card.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    },
    [filters],
  );

  const filteredCards = useMemo(() => {
    if (!payload) return [] as ReEnrollmentKanbanCard[];
    return payload.cards.filter(filterPredicate);
  }, [payload, filterPredicate]);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      <ReEnrollmentHeader
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={setSelectedPeriodId}
        periodsLoading={periodsLoading}
        cards={payload?.cards ?? []}
        filteredCount={filteredCards.length}
        filters={filters}
        onFiltersChange={setFilters}
        availableGrades={availableGrades}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNewInviteClick={() => setIsEligibleDrawerOpen(true)}
        totalEligible={totalEligible}
      />

      {selectedPeriodId && (
        <EligibleStudentsDrawer
          periodId={selectedPeriodId}
          isOpen={isEligibleDrawerOpen}
          onClose={() => setIsEligibleDrawerOpen(false)}
        />
      )}

      {payload && payload.cards.length > 0 && (
        <div className="px-6 pt-3">
          <ReEnrollmentPendenciesWidget cards={payload.cards} />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {periodsLoading ? (
          <CenteredState
            icon={<Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
            label="Carregando campanhas…"
          />
        ) : periods.length === 0 ? (
          <CenteredState
            icon={<AlertCircle className="w-6 h-6 text-neutral-400" />}
            label="Nenhuma campanha cadastrada."
          />
        ) : kanbanLoading ? (
          <CenteredState
            icon={<Loader2 className="w-6 h-6 animate-spin text-neutral-400" />}
            label="Carregando…"
          />
        ) : kanbanError ? (
          <CenteredState
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            label={`Erro ao carregar: ${error instanceof Error ? error.message : 'erro desconhecido'}`}
          />
        ) : payload ? (
          viewMode === 'kanban' ? (
            <ReEnrollmentKanbanView payload={payload} filter={filterPredicate} />
          ) : (
            <ReEnrollmentListView cards={filteredCards} />
          )
        ) : null}
      </div>
    </div>
  );
}

function CenteredState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-neutral-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}
