import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import PeriodsOverview from './PeriodsOverview';
import CreatePeriodForm from './CreatePeriodForm';

/**
 * Route wrapper for /crm/re-enrollments/periods — the "configuration" home
 * for re-enrollment campaigns. List existing campaigns, create a new one,
 * drill into one via /crm/re-enrollments/:periodId.
 */
export default function PeriodsOverviewPage() {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-3">
          <Link
            to="/crm/re-enrollments"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Kanban
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Campanhas de Rematrícula</h1>
            <p className="text-sm text-neutral-500">Criar e gerenciar campanhas</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {showCreateForm && <CreatePeriodForm onClose={() => setShowCreateForm(false)} />}
        <PeriodsOverview onSelect={(id) => navigate(`/crm/re-enrollments/${id}`)} />
      </div>
    </div>
  );
}
