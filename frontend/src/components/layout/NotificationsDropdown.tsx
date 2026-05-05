import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  ShoppingCart,
  Users,
  QrCode,
  FileText,
  Trash2,
  Check,
  X,
  Loader2,
  BellOff,
  MoreHorizontal,
  AtSign,
  Reply,
  Smile,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useLanguageStore } from '@/stores/languageStore';
import { onNotification } from '@/lib/socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const typeIcons: Record<string, typeof Bell> = {
  ticket_assigned: MessageSquare,
  ticket_comment: MessageSquare,
  purchase_status: ShoppingCart,
  lead_updated: Users,
  asset_assigned: QrCode,
  document_uploaded: FileText,
  account_created: Users,
  chat_mention: AtSign,
  chat_dm: MessageSquare,
  chat_thread_reply: Reply,
  chat_reaction: Smile,
  channel_added: MessageSquare,
  gate_approval_required: ShieldCheck,
  gate_approval_decided: CheckCircle,
  gate_advanced: ArrowRight,
  default: Bell,
};

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  ticket_assigned: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  ticket_comment: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  purchase_status: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  lead_updated: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  asset_assigned: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  document_uploaded: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  account_created: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  chat_mention: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  chat_dm: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  chat_thread_reply: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
  chat_reaction: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  channel_added: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  gate_approval_required: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  gate_approval_decided: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  gate_advanced: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  default: { bg: 'bg-neutral-50', text: 'text-neutral-600', border: 'border-neutral-200' },
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { language, t } = useLanguageStore();

  // Listen for real-time notifications via socket
  useEffect(() => {
    const unsubscribe = onNotification((notification: unknown) => {
      const notif = notification as Notification;

      // Show toast for new notification
      toast.custom(
        (toastInstance) => (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white rounded-xl shadow-large border border-neutral-200 p-4 max-w-sm cursor-pointer"
            onClick={() => {
              toast.dismiss(toastInstance.id);
              setIsOpen(true);
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notif.type]?.bg || typeColors.default.bg}`}>
                {(() => {
                  const Icon = typeIcons[notif.type] || typeIcons.default;
                  return <Icon className={`w-5 h-5 ${typeColors[notif.type]?.text || typeColors.default.text}`} />;
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {t('notifications.new')}
                  </span>
                </div>
                <p className="text-sm font-medium text-neutral-900 mt-1">{notif.title}</p>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-0.5">{notif.message}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.dismiss(toastInstance.id);
                }}
                className="text-neutral-400 hover:text-neutral-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ),
        {
          duration: 5000,
          position: 'top-right',
        }
      );

      // Invalidate query to refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient, t]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveMenu(null);
        setConfirmDelete(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<NotificationsResponse>('/notifications?limit=20');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notifications.allMarkedAsRead'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('notifications.deleteSuccess'));
      setConfirmDelete(null);
      setActiveMenu(null);
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    // TODO: Navigate to notification target based on type and data
    setIsOpen(false);
  };

  const handleMarkAsRead = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
      setActiveMenu(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDelete === id) {
      deleteMutation.mutate(id);
    } else {
      setConfirmDelete(id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('notifications.justNow');
    }

    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === 'pt' ? ptBR : undefined,
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
        aria-label={t('notifications.title')}
      >
        <Bell className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary-600' : 'text-neutral-600 group-hover:text-neutral-800'}`} />

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-error-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl border border-neutral-200 shadow-large z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-neutral-900">
                    {t('notifications.title')}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                      {unreadCount} {t('notifications.unread')}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    {markAllAsReadMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5" />
                    )}
                    {t('notifications.markAllRead')}
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto">
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center px-4">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BellOff className="w-8 h-8 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-700">
                    {t('notifications.empty')}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('notifications.emptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {notifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || typeIcons.default;
                    const colors = typeColors[notification.type] || typeColors.default;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`relative group ${!notification.isRead ? 'bg-primary-50/30' : 'bg-white'}`}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full px-4 py-3 flex items-start gap-3 hover:bg-neutral-50 transition-colors text-left"
                        >
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}>
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-8">
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-neutral-600 line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1.5">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-4 ring-primary-100" />
                            </div>
                          )}
                        </button>

                        {/* Actions Menu */}
                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(activeMenu === notification.id ? null : notification.id);
                                setConfirmDelete(null);
                              }}
                              className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                            </button>

                            {/* Actions Dropdown */}
                            <AnimatePresence>
                              {activeMenu === notification.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg border border-neutral-200 shadow-lg z-10 py-1"
                                >
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(e, notification)}
                                      className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Check className="w-4 h-4" />
                                      {t('notifications.markAsRead')}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDelete(e, notification.id)}
                                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                                      confirmDelete === notification.id
                                        ? 'bg-error-50 text-error-600 hover:bg-error-100'
                                        : 'text-neutral-700 hover:bg-neutral-50'
                                    }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    {confirmDelete === notification.id
                                      ? t('notifications.deleteConfirm')
                                      : t('notifications.delete')}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  onClick={() => {
                    // TODO: Navigate to notifications page
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {t('notifications.viewAll')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
