import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, AlertCircle, Clock, CheckCircle, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { get, post, getErrorMessage } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import TicketDetailView from './TicketDetailView';

interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  creator: { id: string; displayName: string; avatarUrl?: string };
  assignee?: { id: string; displayName: string; avatarUrl?: string };
  _count: { comments: number };
}

interface NewTicketForm {
  title: string;
  description: string;
  department: string;
  priority: string;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-neutral-100 text-neutral-600',
  MEDIUM: 'bg-warning-100 text-warning-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-error-100 text-error-700',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-warning-100 text-warning-700',
  IN_PROGRESS: 'bg-primary-100 text-primary-700',
  RESOLVED: 'bg-success-100 text-success-700',
  CLOSED: 'bg-neutral-100 text-neutral-600',
};

const statusIcons: Record<string, typeof AlertCircle> = {
  OPEN: AlertCircle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CheckCircle,
};

const departments = [
  { id: 'IT', label: 'TI' },
  { id: 'MAINTENANCE', label: 'Manutenção' },
  { id: 'CLEANING', label: 'Limpeza' },
  { id: 'SECRETARIAT', label: 'Secretaria' },
  { id: 'GENERAL', label: 'Geral' },
];

export default function TicketsTab() {
  const { t } = useLanguageStore();
  const queryClient = useQueryClient();
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewTicketForm>();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, departmentFilter]);

  // Fetch tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', { search: debouncedSearch, status: statusFilter, department: departmentFilter, page }],
    queryFn: () => get<Ticket[]>('/tickets', {
      params: {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        page,
        limit: LIMIT,
      },
    }),
  });

  const tickets = ticketsData?.data || [];
  const meta = ticketsData?.meta;
  const totalPages = meta?.totalPages || 1;
  const total = meta?.total || tickets.length;

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: (data: NewTicketForm) => post('/tickets', data),
    onSuccess: () => {
      toast.success('Ticket criado com sucesso!');
      setShowNewModal(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Show detail view when a ticket is selected
  if (selectedTicketId) {
    return (
      <TicketDetailView
        ticketId={selectedTicketId}
        onBack={() => setSelectedTicketId(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-neutral-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary btn-md"
          >
            <Plus className="w-4 h-4" />
            {t('communication.newTicket')}
          </button>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t('communication.searchTickets')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 w-full sm:w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">{t('communication.allStatus')}</option>
              <option value="OPEN">{t('ticket.open')}</option>
              <option value="IN_PROGRESS">{t('ticket.inProgress')}</option>
              <option value="RESOLVED">{t('ticket.resolved')}</option>
              <option value="CLOSED">{t('ticket.closed')}</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="">{t('communication.allDepartments')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700 mb-2">{t('communication.noTickets')}</p>
            <p className="text-neutral-500 mb-6">{t('communication.createFirst')}</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary btn-md"
            >
              <Plus className="w-4 h-4" />
              {t('communication.newTicket')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket, index) => {
              const StatusIcon = statusIcons[ticket.status];

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="card p-4 hover:shadow-medium transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-neutral-500">{ticket.code}</span>
                        <span className={`badge ${statusColors[ticket.status]}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {t(`ticket.${ticket.status === 'IN_PROGRESS' ? 'inProgress' : ticket.status.toLowerCase()}`)}
                        </span>
                        <span className={`badge ${priorityColors[ticket.priority]}`}>
                          {t(`ticket.priority.${ticket.priority.toLowerCase()}`)}
                        </span>
                      </div>
                      <h4 className="font-medium text-neutral-900 mb-1">{ticket.title}</h4>
                      <p className="text-sm text-neutral-500 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                        <span>
                          {departments.find((d) => d.id === ticket.department)?.label || ticket.department}
                        </span>
                        <span>•</span>
                        <span>{ticket._count.comments} {t('communication.comments')}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(ticket.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {ticket.assignee && (
                        <Avatar
                          src={ticket.assignee.avatarUrl}
                          name={ticket.assignee.displayName}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > LIMIT && (
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm text-neutral-500">
              Mostrando {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} de {total} tickets
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-neutral-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-xl shadow-large w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold text-neutral-900">{t('communication.newTicket')}</h2>
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-neutral-500" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit((data) => createMutation.mutate(data))}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="label">{t('communication.title')}</label>
                    <input
                      {...register('title', { required: 'Título é obrigatório' })}
                      className={`input ${errors.title ? 'input-error' : ''}`}
                      placeholder={t('communication.titlePlaceholder')}
                    />
                    {errors.title && (
                      <p className="text-error-500 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">{t('communication.department')}</label>
                    <select
                      {...register('department', { required: 'Selecione um departamento' })}
                      className={`input ${errors.department ? 'input-error' : ''}`}
                    >
                      <option value="">{t('communication.selectDepartment')}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="text-error-500 text-sm mt-1">{errors.department.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="label">{t('communication.priority')}</label>
                    <div className="flex gap-2">
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                        <label key={p} className="flex-1">
                          <input
                            type="radio"
                            {...register('priority', { required: true })}
                            value={p}
                            className="sr-only peer"
                          />
                          <div className="text-center py-2 px-3 rounded-lg border border-neutral-200 text-sm font-medium cursor-pointer peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 hover:bg-neutral-50 transition-colors">
                            {t(`ticket.priority.${p.toLowerCase()}`)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">{t('communication.description')}</label>
                    <textarea
                      {...register('description', {
                        required: 'Descrição é obrigatória',
                        minLength: { value: 10, message: 'Mínimo 10 caracteres' },
                      })}
                      rows={4}
                      className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                      placeholder={t('communication.descriptionPlaceholder')}
                    />
                    {errors.description && (
                      <p className="text-error-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="flex-1 btn btn-secondary btn-md"
                    >
                      {t('communication.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 btn btn-primary btn-md"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        t('communication.createTicket')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
