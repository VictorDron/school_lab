import { motion } from 'framer-motion';
import { MessageSquare, Ticket, Clock, LayoutList, Calendar, Hash, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { get } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import UpcomingWidget from './calendar/UpcomingWidget';
import { useTaskBoards } from '@/hooks/useTaskBoards';
import { useChannels } from '@/hooks/useChannels';

interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
}

interface RecentTicket {
  id: string;
  code: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
}

const statusDot: Record<string, string> = {
  OPEN: 'bg-warning-500',
  IN_PROGRESS: 'bg-primary-500',
  RESOLVED: 'bg-success-500',
  CLOSED: 'bg-neutral-400',
};

const statusLabel: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function SkeletonLoader() {
  return (
    <div className="p-6 overflow-y-auto h-full animate-pulse">
      {/* Greeting skeleton */}
      <div className="mb-6">
        <div className="h-7 bg-neutral-200 rounded w-56 mb-1.5" />
        <div className="h-4 bg-neutral-100 rounded w-72" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card border-neutral-100 border-l-[3px] border-l-neutral-200 p-4">
            <div className="h-4 w-4 bg-neutral-200 rounded mb-3" />
            <div className="h-8 bg-neutral-200 rounded w-12 mb-1.5" />
            <div className="h-3 bg-neutral-100 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Widgets skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card border-neutral-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-neutral-200 rounded w-32" />
              <div className="h-3 bg-neutral-100 rounded w-14" />
            </div>
            <div className="divide-y divide-neutral-50">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 bg-neutral-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const [, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const { data: ticketStats, isLoading: loadingTickets } = useQuery({
    queryKey: ['ticketStats'],
    queryFn: () => get<TicketStats>('/tickets/stats'),
  });

  const { data: channels, isLoading: loadingChannels } = useChannels();
  const { data: boards, isLoading: loadingBoards } = useTaskBoards();
  const { data: recentTicketsData } = useQuery({
    queryKey: ['tickets', { limit: 4 }],
    queryFn: () => get<RecentTicket[]>('/tickets', { params: { limit: 4 } }),
  });
  const recentTickets = recentTicketsData?.data || [];

  const stats = ticketStats?.data;
  const channelCount = channels?.length || 0;
  const boardCount = boards?.length || 0;

  const statCards = [
    {
      title: 'Canais Ativos',
      value: channelCount,
      icon: MessageSquare,
      accent: 'border-l-indigo-400',
    },
    {
      title: 'Tickets Abertos',
      value: stats?.open || 0,
      icon: Ticket,
      accent: 'border-l-warning-400',
    },
    {
      title: 'Em Andamento',
      value: stats?.inProgress || 0,
      icon: Clock,
      accent: 'border-l-primary-400',
    },
    {
      title: 'Quadros de Tarefas',
      value: boardCount,
      icon: LayoutList,
      accent: 'border-l-emerald-400',
    },
  ];

  const isLoading = loadingTickets || loadingChannels || loadingBoards;

  if (isLoading) {
    return <SkeletonLoader />;
  }

  const firstName = user?.displayName?.split(' ')[0] || '';

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-xl font-semibold text-neutral-900">
          {getGreeting()}, {firstName}
        </h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Aqui esta um resumo da sua comunicacao
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card border-neutral-100 border-l-[3px] ${card.accent} p-4`}
            >
              <Icon className="w-4 h-4 text-neutral-400 mb-3" />
              <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{card.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card border-neutral-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Proximos Eventos</h3>
            <button
              onClick={() => setSearchParams({ tab: 'calendar' })}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <UpcomingWidget />
        </motion.div>

        {/* Recent Channels */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card border-neutral-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Canais Recentes</h3>
            <button
              onClick={() => setSearchParams({ tab: 'chat' })}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {channels && channels.length > 0 ? (
            <div className="divide-y divide-neutral-50">
              {channels.slice(0, 4).map((channel: any) => (
                <div key={channel.id} className="flex items-center gap-3 py-2.5">
                  <Hash className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{channel.name}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {channel.description || 'Sem descricao'}
                    </p>
                  </div>
                  {channel.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-full">
                      {channel.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-1.5" />
              <p className="text-xs">Nenhum canal encontrado</p>
            </div>
          )}
        </motion.div>

        {/* Task Boards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card border-neutral-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Quadros de Tarefas</h3>
            <button
              onClick={() => setSearchParams({ tab: 'tasks' })}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {boards && boards.length > 0 ? (
            <div className="divide-y divide-neutral-50">
              {boards.slice(0, 4).map((board: any) => (
                <div key={board.id} className="flex items-center gap-3 py-2.5">
                  <LayoutList className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{board.name}</p>
                    <p className="text-xs text-neutral-500">
                      {board._count?.columns || 0} colunas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-400">
              <LayoutList className="w-8 h-8 mx-auto mb-1.5" />
              <p className="text-xs">Nenhum quadro criado</p>
            </div>
          )}
        </motion.div>

        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card border-neutral-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Tickets Recentes</h3>
            <button
              onClick={() => setSearchParams({ tab: 'tickets' })}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentTickets.length > 0 ? (
            <div className="divide-y divide-neutral-50">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center gap-3 py-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[ticket.status]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{ticket.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span className="font-mono text-neutral-400">{ticket.code}</span>
                      <span>·</span>
                      <span>{statusLabel[ticket.status]}</span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400 flex-shrink-0">
                    {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-400">
              <Ticket className="w-8 h-8 mx-auto mb-1.5" />
              <p className="text-xs">Nenhum ticket recente</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
