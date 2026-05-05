import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useMessages, useThreadReplies } from '@/hooks/useMessages';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import type { Message } from '@/types/communication';

interface ThreadPanelProps {
  channelId: string;
  messageId: string;
  onClose: () => void;
}

export default function ThreadPanel({ channelId, messageId, onClose }: ThreadPanelProps) {
  const { data: messagesData } = useMessages(channelId);
  const { data: repliesData, isLoading: loadingReplies } = useThreadReplies(channelId, messageId);

  const parentMessage = useMemo(() => {
    const raw = messagesData?.data || messagesData || [];
    const list: Message[] = Array.isArray(raw) ? raw : [];
    return list.find((m) => m.id === messageId);
  }, [messagesData, messageId]);

  const replies = useMemo(() => {
    const raw = repliesData?.data || repliesData || [];
    return Array.isArray(raw) ? raw : [];
  }, [repliesData]);

  return (
    <AnimatePresence>
      <motion.div
        key="thread-panel"
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full sm:w-[400px] max-w-full border-l border-neutral-200 bg-white flex flex-col h-full flex-shrink-0 absolute sm:relative right-0 z-30 sm:z-auto"
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-neutral-900">Thread</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Parent message */}
        {parentMessage && (
          <div className="px-2 py-3 border-b border-neutral-100">
            <MessageItem message={parentMessage} channelId={channelId} />
          </div>
        )}

        {/* Replies */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingReplies ? (
            <div className="flex justify-center py-6">
              <LoadingSpinner />
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <p className="text-sm">Nenhuma resposta ainda.</p>
              <p className="text-xs mt-1">Seja o primeiro a responder!</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {replies.map((reply: Message) => (
                <MessageItem key={reply.id} message={reply} channelId={channelId} />
              ))}
            </div>
          )}
        </div>

        {/* Reply input */}
        <MessageInput channelId={channelId} parentId={messageId} />
      </motion.div>
    </AnimatePresence>
  );
}
