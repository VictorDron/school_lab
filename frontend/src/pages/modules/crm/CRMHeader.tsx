import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Flag, Clock, CheckCircle, LayoutGrid, List, CalendarDays, BarChart3, Settings, Bell, CheckCheck } from 'lucide-react';
import { StatCard } from './StatCard';
import { sourceConfig, type LeadSource } from '@/types/crm';
import { useUnviewedLeadsCount, useMarkAllLeadsViewed } from '@/hooks/useUnviewedLeads';
import toast from 'react-hot-toast';

type ViewMode = 'kanban' | 'list' | 'calendar';

interface CRMHeaderProps {
  stats: {
    total: number;
    flagged: number;
    thisMonth: number;
    thisWeek: number;
  } | undefined;
  filteredStats?: {
    total: number;
    flagged: number;
    thisMonth: number;
    thisWeek: number;
  };
  isFiltered: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSource: LeadSource | '';
  setSelectedSource: (source: LeadSource | '') => void;
  showFlagged: boolean;
  setShowFlagged: (show: boolean) => void;
  canEdit: boolean;
  isAdmin: boolean;
  onCreateClick: () => void;
  onColumnsClick: () => void;
}

export function CRMHeader({
  stats,
  filteredStats,
  isFiltered,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedSource,
  setSelectedSource,
  showFlagged,
  setShowFlagged,
  canEdit,
  isAdmin,
  onCreateClick,
  onColumnsClick,
}: CRMHeaderProps) {
  const navigate = useNavigate();
  const { data: unviewedCount } = useUnviewedLeadsCount();
  const markAllViewedMutation = useMarkAllLeadsViewed();

  const handleClearNotifications = () => {
    markAllViewedMutation.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`${data.data?.count || 0} notificações limpas`);
      },
    });
  };

  return (
    <div className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-4 overflow-x-auto pb-2">
        <StatCard label="Total" value={stats?.total || 0} filteredValue={isFiltered ? filteredStats?.total : undefined} icon={<Users className="w-4 h-4" />} color="blue" />
        <StatCard label="Sinalizados" value={stats?.flagged || 0} filteredValue={isFiltered ? filteredStats?.flagged : undefined} icon={<Flag className="w-4 h-4" />} color="amber" />
        <StatCard label="Este Mes" value={stats?.thisMonth || 0} filteredValue={isFiltered ? filteredStats?.thisMonth : undefined} icon={<Clock className="w-4 h-4" />} color="green" />
        <StatCard
          label="Esta Semana"
          value={stats?.thisWeek || 0}
          filteredValue={isFiltered ? filteredStats?.thisWeek : undefined}
          icon={<CheckCircle className="w-4 h-4" />}
          color="purple"
        />

        {/* Unviewed notifications indicator */}
        {(unviewedCount ?? 0) > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
              <Bell className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">
                {unviewedCount} {unviewedCount === 1 ? 'novo formulário' : 'novos formulários'}
              </span>
            </div>
            <button
              onClick={handleClearNotifications}
              disabled={markAllViewedMutation.isPending}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-md transition-colors"
              title="Marcar todos como vistos"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={onCreateClick} className="btn btn-primary btn-md">
              <Plus className="w-4 h-4" />
              Novo Lead
            </button>
          )}

          {isAdmin && (
            <button onClick={onColumnsClick} className="btn btn-secondary btn-md" title="Gerenciar Colunas">
              <Settings className="w-4 h-4" />
              Colunas
            </button>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white shadow-sm text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Calendário"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
          </div>

          {/* Dashboard button */}
          <button
            onClick={() => navigate('/crm/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-[#0aacce] hover:bg-[#0aacce]/5 rounded-lg border border-neutral-200 transition-colors"
            title="Dashboard de Admissao"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as LeadSource | '')}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm"
            >
              <option value="">Todas origens</option>
              {Object.entries(sourceConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowFlagged(!showFlagged)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition-colors ${
                showFlagged
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Flag className={`w-4 h-4 ${showFlagged ? 'fill-current' : ''}`} />
              Sinalizados
            </button>
          </div>
      </div>
    </div>
  );
}
