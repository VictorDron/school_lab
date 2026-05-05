import { useEffect, useRef, useMemo } from 'react';
import { Hash, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMessages } from '@/hooks/useMessages';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import { Avatar } from '@/components/ui/Avatar';
import MessageItem from './MessageItem';
import type { Message } from '@/types/communication';

interface DmUserInfo {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

interface MessageListProps {
  channelId: string;
  isDm?: boolean;
  dmUser?: DmUserInfo | null;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const groups = new Map<string, Message[]>();
  for (const msg of messages) {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(msg);
    } else {
      groups.set(dateKey, [msg]);
    }
  }
  return groups;
}

const GROUPING_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function shouldGroup(prev: Message, curr: Message): boolean {
  if (prev.senderId !== curr.senderId) return false;
  if (prev.isDeleted || curr.isDeleted) return false;
  const diff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return diff < GROUPING_THRESHOLD_MS;
}

export default function MessageList({ channelId, isDm = false, dmUser }: MessageListProps) {
  const { data, isLoading } = useMessages(channelId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    const raw = data?.data || data || [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (messages.length === 0) {
    if (isDm && dmUser) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Avatar
              src={dmUser.avatarUrl}
              name={dmUser.displayName}
              size="xl"
              className="mx-auto mb-3"
            />
            <p className="font-semibold text-neutral-900">{dmUser.displayName}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-neutral-400">
              <MessageCircle className="w-4 h-4" />
              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-neutral-400">
          <Hash className="w-12 h-12 mx-auto mb-4" />
          <p className="font-medium">Início do canal</p>
          <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {Array.from(groupedMessages.entries()).map(([dateKey, msgs]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs font-medium text-neutral-500 px-2">
              {formatDateSeparator(dateKey)}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Messages for this date */}
          <div className="space-y-0.5">
            {msgs.map((msg, idx) => {
              const prev = idx > 0 ? msgs[idx - 1] : null;
              const isGrouped = prev ? shouldGroup(prev, msg) : false;
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  channelId={channelId}
                  isGrouped={isGrouped}
                  isDm={isDm}
                />
              );
            })}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
