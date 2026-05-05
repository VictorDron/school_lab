import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  Send,
  MessageSquare,
  Activity,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { get, post, patch, getErrorMessage } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

interface TicketComment {
  id: string;
  content: string;
  attachments?: unknown;
  isInternal: boolean;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl?: string };
}

interface TicketActivity {
  id: string;
  action: string;
  actorId: string;
  details: Record<string, string>;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  department: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  attachments?: unknown;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  createdById: string;
  assigneeId?: string;
  creator: { id: string; displayName: string; email: string; avatarUrl?: string };
  assignee?: { id: string; displayName: string; email: string; avatarUrl?: string };
  comments: TicketComment[];
  activity: TicketActivity[];
}

interface UserOption {
  id: string;
  displayName: string;
  avatarUrl?: string;
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

const statusLabels: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const departmentLabels: Record<string, string> = {
  IT: 'TI',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
  SECRETARIAT: 'Secretaria',
  GENERAL: 'Geral',
};

const activityLabels: Record<string, string> = {
  CREATED: 'criou o ticket',
  STATUS_CHANGED: 'alterou o status',
  ASSIGNED: 'atribuiu o ticket',
  UPDATED: 'atualizou o ticket',
  COMMENTED: 'adicionou um comentário',
};

interface TicketDetailViewProps {
  ticketId: string;
  onBack: () => void;
}

export default function TicketDetailView({ ticketId, onBack }: TicketDetailViewProps) {
  const { t } = useLanguageStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [activeSection, setActiveSection] = useState<'comments' | 'activity'>('comments');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { data: ticketData, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => get<TicketDetail>(`/tickets/${ticketId}`),
  });

  const ticket = ticketData?.data;

  // Fetch users for assignee dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => get<UserOption[]>('/users'),
  });

  const users = usersData?.data || [];

  // Update ticket mutation
  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; assigneeId?: string | null }) =>
      patch(`/tickets/${ticketId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketStats'] });
      toast.success('Ticket atualizado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      post(`/tickets/${ticketId}/comments`, { content }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Comentário adicionado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  useEffect(() => {
    if (activeSection === 'comments') {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.comments?.length, activeSection]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-neutral-700">Ticket não encontrado</p>
        <button onClick={onBack} className="btn btn-secondary btn-md mt-4">
          <ArrowLeft className="w-4 h-4" />
          {t('communication.back')}
        </button>
      </div>
    );
  }

  const StatusIcon = statusIcons[ticket.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <span className="text-sm font-mono text-neutral-500">{ticket.code}</span>
          <span className={`badge ${statusColors[ticket.status]}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusLabels[ticket.status]}
          </span>
          <span className={`badge ${priorityColors[ticket.priority]}`}>
            {priorityLabels[ticket.priority]}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900">{ticket.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Description + Info Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description */}
            <div className="lg:col-span-2 card p-5">
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                {t('communication.description')}
              </h3>
              <p className="text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {/* Info + Actions */}
            <div className="space-y-4">
              {/* Metadata */}
              <div className="card p-5 space-y-4">
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">
                    {t('communication.department')}
                  </span>
                  <p className="text-sm font-medium text-neutral-900 mt-1">
                    {departmentLabels[ticket.department] || ticket.department}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">
                    {t('communication.creator')}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar
                      src={ticket.creator.avatarUrl}
                      name={ticket.creator.displayName}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-neutral-900">
                      {ticket.creator.displayName}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-500 uppercase">
                    {t('communication.createdAt')}
                  </span>
                  <p className="text-sm text-neutral-700 mt-1">
                    {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <span className="text-xs font-semibold text-neutral-500 uppercase">
                      Resolvido em
                    </span>
                    <p className="text-sm text-neutral-700 mt-1">
                      {format(new Date(ticket.resolvedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">
                    {t('communication.status')}
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                    disabled={updateMutation.isPending}
                    className="input mt-1 text-sm"
                  >
                    <option value="OPEN">{statusLabels.OPEN}</option>
                    <option value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</option>
                    <option value="RESOLVED">{statusLabels.RESOLVED}</option>
                    <option value="CLOSED">{statusLabels.CLOSED}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase">
                    {t('communication.assignee')}
                  </label>
                  <select
                    value={ticket.assigneeId || ''}
                    onChange={(e) =>
                      updateMutation.mutate({
                        assigneeId: e.target.value || null,
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="input mt-1 text-sm"
                  >
                    <option value="">Não atribuído</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.displayName}
                      </option>
                    ))}
                  </select>
                  {ticket.assignee && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar
                        src={ticket.assignee.avatarUrl}
                        name={ticket.assignee.displayName}
                        size="sm"
                      />
                      <span className="text-sm text-neutral-700">
                        {ticket.assignee.displayName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Comments / Activity Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-neutral-200">
              <button
                onClick={() => setActiveSection('comments')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === 'comments'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                {t('communication.comments')} ({ticket.comments.length})
              </button>
              <button
                onClick={() => setActiveSection('activity')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === 'activity'
                    ? 'text-primary-600 border-primary-600'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700'
                }`}
              >
                <Activity className="w-4 h-4" />
                {t('communication.activity')} ({ticket.activity.length})
              </button>
            </div>

            <div className="p-5">
              {activeSection === 'comments' ? (
                <div className="space-y-4">
                  {ticket.comments.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">{t('communication.noComments')}</p>
                    </div>
                  ) : (
                    ticket.comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                      >
                        <Avatar
                          src={comment.user.avatarUrl}
                          name={comment.user.displayName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm text-neutral-900">
                              {comment.user.displayName}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {comment.isInternal && (
                              <span className="badge bg-warning-100 text-warning-700 text-xs">
                                Interno
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={commentsEndRef} />
                </div>
              ) : (
                <div className="space-y-3">
                  {ticket.activity.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400">
                      <Activity className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">Nenhuma atividade registrada</p>
                    </div>
                  ) : (
                    ticket.activity.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 py-2 border-l-2 border-neutral-200 pl-4"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-neutral-700">
                            <span className="font-medium">
                              {activityLabels[act.action] || act.action}
                            </span>
                            {act.details?.previousStatus && act.details?.newStatus && (
                              <span className="text-neutral-500">
                                {' '}de {statusLabels[act.details.previousStatus] || act.details.previousStatus}
                                {' '}para{' '}
                                <span className="font-medium">
                                  {statusLabels[act.details.newStatus] || act.details.newStatus}
                                </span>
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {formatDistanceToNow(new Date(act.createdAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Input */}
      {ticket.status !== 'CLOSED' && (
        <form onSubmit={handleSendComment} className="p-4 border-t border-neutral-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('communication.addComment')}
              className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentMutation.isPending}
              className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commentMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
