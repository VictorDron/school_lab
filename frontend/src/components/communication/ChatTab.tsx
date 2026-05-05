import { useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, Pin, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useChannels, useDirectMessages } from '@/hooks/useChannels';
import { usePinnedMessages } from '@/hooks/useMessages';
import { useCommunicationStore } from '@/stores/communicationStore';
import { getSocket } from '@/lib/socket';
import ChannelSidebar from './chat/ChannelSidebar';
import ChannelHeader from './chat/ChannelHeader';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import ThreadPanel from './chat/ThreadPanel';
import MemberListPanel from './chat/MemberListPanel';
import DmProfilePanel from './chat/DmProfilePanel';
import MessageSearchPanel from './chat/MessageSearchPanel';
import MessageItem from './chat/MessageItem';
import type { Channel, Message } from '@/types/communication';

export default function ChatTab() {
  const queryClient = useQueryClient();
  const { data: channels = [] } = useChannels();
  const { data: dms = [] } = useDirectMessages();
  const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const {
    activeChannelId,
    setActiveChannelId,
    threadMessageId,
    closeThread,
    showMembers,
    showPinned,
    showSearch,
    showDmProfile,
    togglePinned,
    toggleDmProfile,
    onlineUsers,
    setUserOnline,
    setUserOffline,
    typingUsers,
    addTypingUser,
    removeTypingUser,
  } = useCommunicationStore();

  // Select first channel if none selected
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0].id);
    }
  }, [channels, activeChannelId, setActiveChannelId]);

  const selectedChannel = useMemo(
    () => channels.find((c: Channel) => c.id === activeChannelId),
    [channels, activeChannelId]
  );

  // Find DM user info when selected channel is a DM
  const activeDm = useMemo(() => {
    if (!selectedChannel || selectedChannel.type !== 'DIRECT') return null;
    return dms.find((dm: any) => dm.id === activeChannelId) || null;
  }, [selectedChannel, dms, activeChannelId]);

  const dmUser = activeDm?.user || null;
  const dmOnline = activeDm?.isOnline || (dmUser?.id ? onlineUsers.has(dmUser.id) : false);

  // Pinned messages
  const { data: pinnedMessages = [] } = usePinnedMessages(activeChannelId);

  // Compute typing text for the active channel
  const typingText = useMemo(() => {
    if (!activeChannelId) return null;
    const prefix = `${activeChannelId}:`;
    const names: string[] = [];
    for (const [key, val] of typingUsers) {
      if (key.startsWith(prefix)) names.push(val.displayName);
    }
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} está digitando...`;
    if (names.length === 2) return `${names[0]} e ${names[1]} estão digitando...`;
    return `${names[0]} e mais ${names.length - 1} estão digitando...`;
  }, [activeChannelId, typingUsers]);

  // Socket.IO real-time events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    };

    const handleEditedMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
    };

    const handleDeletedMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
    };

    const handleReactionAdded = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
    };

    const handleReactionRemoved = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
    };

    const handleUserOnline = (data: { userId: string }) => {
      setUserOnline(data.userId);
    };

    const handleUserOffline = (data: { userId: string }) => {
      setUserOffline(data.userId);
    };

    const handleTypingStart = (data: { userId: string; displayName: string; channelId: string }) => {
      addTypingUser(data.channelId, data.userId, data.displayName);
      // Auto-remove after 3s if no typing:stop received
      const key = `${data.channelId}:${data.userId}`;
      const existing = typingTimersRef.current.get(key);
      if (existing) clearTimeout(existing);
      typingTimersRef.current.set(
        key,
        setTimeout(() => {
          removeTypingUser(data.channelId, data.userId);
          typingTimersRef.current.delete(key);
        }, 3000),
      );
    };

    const handleTypingStop = (data: { userId: string; channelId: string }) => {
      removeTypingUser(data.channelId, data.userId);
      const key = `${data.channelId}:${data.userId}`;
      const timer = typingTimersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        typingTimersRef.current.delete(key);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:edited', handleEditedMessage);
    socket.on('message:deleted', handleDeletedMessage);
    socket.on('reaction:added', handleReactionAdded);
    socket.on('reaction:removed', handleReactionRemoved);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:edited', handleEditedMessage);
      socket.off('message:deleted', handleDeletedMessage);
      socket.off('reaction:added', handleReactionAdded);
      socket.off('reaction:removed', handleReactionRemoved);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      // Cleanup all typing timers
      for (const timer of typingTimersRef.current.values()) {
        clearTimeout(timer);
      }
      typingTimersRef.current.clear();
    };
  }, [activeChannelId, queryClient, setUserOnline, setUserOffline, addTypingUser, removeTypingUser]);

  return (
    <div className="h-full flex relative">
      {/* Sidebar */}
      <ChannelSidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
        {selectedChannel ? (
          <>
            <ChannelHeader channel={selectedChannel} dmUser={dmUser} dmOnline={dmOnline} />

            {/* Pinned Messages Dropdown */}
            <AnimatePresence>
              {showPinned && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-14 right-0 z-40 w-96 max-h-80 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden"
                  style={{ marginRight: showMembers ? '16rem' : '0' }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Pin className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-neutral-900">
                        Mensagens Fixadas
                      </span>
                    </div>
                    <button
                      onClick={togglePinned}
                      className="p-1 hover:bg-neutral-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-neutral-500" />
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-64 p-2">
                    {pinnedMessages.length === 0 ? (
                      <p className="text-center py-6 text-neutral-400 text-sm">
                        Nenhuma mensagem fixada
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {pinnedMessages.map((msg: Message) => (
                          <MessageItem
                            key={msg.id}
                            message={msg}
                            channelId={activeChannelId!}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Search Panel */}
            <AnimatePresence>
              {showSearch && activeChannelId && (
                <MessageSearchPanel channelId={activeChannelId} />
              )}
            </AnimatePresence>

            <MessageList channelId={activeChannelId!} isDm={!!dmUser} dmUser={dmUser} />
            <MessageInput
              channelId={activeChannelId!}
              channelName={dmUser ? dmUser.displayName : selectedChannel.name}
              isDm={!!dmUser}
              typingText={typingText}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <Hash className="w-16 h-16 mx-auto mb-4" />
              <p className="font-medium">Selecione um canal</p>
              <p className="text-sm">Escolha um canal para comecar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panels */}
      <AnimatePresence>
        {threadMessageId && activeChannelId && (
          <ThreadPanel
            channelId={activeChannelId}
            messageId={threadMessageId}
            onClose={closeThread}
          />
        )}
      </AnimatePresence>

      {showMembers && activeChannelId && !dmUser && (
        <MemberListPanel channelId={activeChannelId} />
      )}

      <AnimatePresence>
        {showDmProfile && dmUser && (
          <DmProfilePanel
            dmUser={dmUser}
            isOnline={dmOnline}
            onClose={toggleDmProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
