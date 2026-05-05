import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Calendar, Search, User, X } from 'lucide-react';
import {
  AuditFilters,
  AuditFiltersSetters,
  AuditStats,
  User as AuditUser,
  actionCategories,
  dateRanges,
} from './constants';
import { getColorClasses } from './helpers';

interface AuditFiltersPanelProps {
  filters: AuditFilters;
  setters: AuditFiltersSetters;
  users: AuditUser[];
  entityTypes: string[];
  actionsForCategory: string[];
  activeFiltersCount: number;
  stats: AuditStats;
  onClearFilters: () => void;
}

export function AuditFiltersPanel({
  filters,
  setters,
  users,
  entityTypes,
  actionsForCategory,
  activeFiltersCount,
  stats,
  onClearFilters,
}: AuditFiltersPanelProps) {
  const {
    searchQuery,
    selectedUser,
    selectedCategory,
    selectedAction,
    selectedEntityType,
    selectedDateRange,
    customStartDate,
    customEndDate,
    showFilters,
  } = filters;
  const {
    setPage,
    setSearchQuery,
    setSelectedUser,
    setSelectedCategory,
    setSelectedAction,
    setSelectedEntityType,
    setSelectedDateRange,
    setCustomStartDate,
    setCustomEndDate,
  } = setters;

  return (
    <>
      {/* Quick search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Buscar por usuário, ação, entidade, IP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expandable filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-2">
              {/* User filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedUser}
                    onChange={(e) => {
                      setSelectedUser(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todos os usuários</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Categoria</label>
                <div className="relative">
                  <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedAction('');
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Todas as categorias</option>
                    {Object.entries(actionCategories).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Ação</label>
                <select
                  value={selectedAction}
                  onChange={(e) => {
                    setSelectedAction(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas as ações</option>
                  {actionsForCategory.map((action) => (
                    <option key={action} value={action}>
                      {action.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity type filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Tipo de Entidade</label>
                <select
                  value={selectedEntityType}
                  onChange={(e) => {
                    setSelectedEntityType(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todos os tipos</option>
                  {entityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range filter */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Período</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={selectedDateRange}
                    onChange={(e) => {
                      setSelectedDateRange(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-neutral-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {dateRanges.map((range) => (
                      <option key={range.id} value={range.id}>
                        {range.label}
                      </option>
                    ))}
                    <option value="custom">Personalizado</option>
                  </select>
                </div>
              </div>

              {/* Clear filters */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">&nbsp;</label>
                <button
                  onClick={onClearFilters}
                  className="w-full px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-600 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={activeFiltersCount === 0 && selectedDateRange === 'last7'}
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              </div>
            </div>

            {/* Custom date range */}
            {selectedDateRange === 'custom' && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Category quick filters */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-500 self-center mr-1">Categorias:</span>
              {Object.entries(actionCategories).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = selectedCategory === key;
                const count = stats.categoryCounts[key] || 0;
                const colorClasses = getColorClasses(config.color);

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(isActive ? '' : key);
                      setSelectedAction('');
                      setPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border-2 ${
                      isActive
                        ? `${colorClasses.badge} ${colorClasses.activeBorder}`
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-transparent'
                    }`}
                  >
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span>{config.label}</span>
                    {count > 0 && <span className="opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
