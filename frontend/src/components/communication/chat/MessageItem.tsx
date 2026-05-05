import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smile,
  MessageSquare,
  Pin,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  FileText,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useAddReaction,
  useRemoveReaction,
  usePinMessage,
  useUnpinMessage,
  useDeleteMessage,
  useEditMessage,
} from "@/hooks/useMessages";
import { useCommunicationStore } from "@/stores/communicationStore";
import { useAuthStore } from "@/stores/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { post } from "@/lib/api";
import EmojiPicker from "./EmojiPicker";
import type { Message, Reaction, Attachment } from "@/types/communication";

const QUICK_EMOJIS = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F602}", "\u{1F632}", "\u{1F622}", "\u{1F389}"];

interface MessageItemProps {
  message: Message;
  channelId: string;
  isGrouped?: boolean;
  isDm?: boolean;
}

function renderContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split by patterns: **bold**, *italic*, `code`, @mentions
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(@\[[^\]]+\]|@\w+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const text = content;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>,
      );
    } else if (match[3]) {
      // *italic*
      parts.push(
        <em key={key++} className="italic">
          {match[4]}
        </em>,
      );
    } else if (match[5]) {
      // `code`
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 bg-neutral-100 text-neutral-800 rounded text-sm font-mono"
        >
          {match[6]}
        </code>,
      );
    } else if (match[7]) {
      // @mention
      const mentionLabel = match[7].startsWith("@[")
        ? `@${match[7].slice(2, -1)}`
        : match[7];
      parts.push(
        <span
          key={key++}
          className="px-1 py-0.5 bg-primary-100 text-primary-700 rounded font-medium"
        >
          {mentionLabel}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [content];
}

export default function MessageItem({ message, channelId, isGrouped = false, isDm = false }: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const { user } = useAuthStore();
  const { openThread } = useCommunicationStore();

  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();

  const [refreshedUrls, setRefreshedUrls] = useState<Record<number, string>>({});
  const [refreshingIdx, setRefreshingIdx] = useState<number | null>(null);

  const handleRefreshUrl = useCallback(async (att: Attachment, idx: number) => {
    if (refreshingIdx !== null) return;
    setRefreshingIdx(idx);
    try {
      const resp = await post<{ url: string }>('/channels/attachments/refresh', {
        url: att.url,
        storagePath: (att as any).storagePath,
      });
      if (resp.data?.url) {
        setRefreshedUrls((prev) => ({ ...prev, [idx]: resp.data!.url }));
      }
    } catch {
      // URL refresh failed silently
    }
    setRefreshingIdx(null);
  }, [refreshingIdx]);

  const isOwnMessage = user?.id === message.senderId;

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    const map = new Map<
      string,
      { emoji: string; count: number; userIds: string[] }
    >();
    for (const reaction of message.reactions || []) {
      const existing = map.get(reaction.emoji);
      if (existing) {
        existing.count++;
        existing.userIds.push(reaction.userId);
      } else {
        map.set(reaction.emoji, {
          emoji: reaction.emoji,
          count: 1,
          userIds: [reaction.userId],
        });
      }
    }
    return Array.from(map.values());
  }, [message.reactions]);

  const handleReactionToggle = (emoji: string) => {
    const userReacted = (message.reactions || []).some(
      (r: Reaction) => r.emoji === emoji && r.userId === user?.id,
    );
    if (userReacted) {
      removeReaction.mutate({ channelId, messageId: message.id, emoji });
    } else {
      addReaction.mutate({ channelId, messageId: message.id, emoji });
    }
  };

  const handlePin = () => {
    if (message.isPinned) {
      unpinMessage.mutate({ channelId, messageId: message.id });
    } else {
      pinMessage.mutate({ channelId, messageId: message.id });
    }
  };

  const handleDelete = () => {
    deleteMessage.mutate({ channelId, messageId: message.id });
    setShowMoreMenu(false);
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage.mutate({
        channelId,
        messageId: message.id,
        content: editContent.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  if (message.isDeleted) {
    return (
      <div
        className="flex items-start gap-3 py-1 px-2 opacity-50"
        data-message-id={message.id}
      >
        {!isGrouped && (
          <Avatar
            src={message.sender.avatarUrl}
            name={message.sender.displayName}
            size="sm"
          />
        )}
        {isGrouped && <div className="w-8 flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-neutral-500 text-sm">
                {message.sender.displayName}
              </span>
            </div>
          )}
          <p className="text-neutral-400 text-sm italic">Mensagem excluída</p>
        </div>
      </div>
    );
  }

  const dmBubbleBg = isDm && isOwnMessage ? 'bg-primary-50/60' : '';

  return (
    <motion.div
      data-message-id={message.id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowMoreMenu(false);
        setShowEmojiPicker(false);
        setShowFullPicker(false);
      }}
      className={`relative flex items-start gap-3 ${isGrouped ? 'py-0.5' : 'py-1.5'} px-2 rounded-lg hover:bg-neutral-50 transition-colors group ${dmBubbleBg}`}
    >
      {!isGrouped ? (
        <Avatar
          src={message.sender.avatarUrl}
          name={message.sender.displayName}
          size="sm"
          className="flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-8 flex-shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-neutral-400">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!isGrouped && (
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-neutral-900 text-sm">
              {message.sender.displayName}
            </span>
            <span className="text-xs text-neutral-400">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            {message.isEdited && (
              <span className="text-xs text-neutral-400">(editado)</span>
            )}
            {message.isPinned && (
              <Pin className="w-3 h-3 text-amber-500 inline" />
            )}
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
              rows={2}
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleEditSave}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Salvar"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleEditCancel}
                className="p-1 text-neutral-500 hover:bg-neutral-100 rounded"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-neutral-700 mt-0.5 break-words text-sm leading-relaxed">
            {renderContent(message.content)}
          </p>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att, idx) => {
              const displayUrl = refreshedUrls[idx] || att.url;
              return att.type.startsWith("image/") ? (
                <a
                  key={idx}
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative group"
                >
                  <img
                    src={displayUrl}
                    alt={att.name}
                    className="max-w-xs max-h-48 rounded-lg border border-neutral-200 object-cover"
                    onError={() => handleRefreshUrl(att, idx)}
                  />
                  {refreshingIdx === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 rounded-lg border border-neutral-200">
                      <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
                    </div>
                  )}
                </a>
              ) : (
                <a
                  key={idx}
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-700 truncate max-w-[200px]">
                    {att.name}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {/* Reactions */}
        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {groupedReactions.map((reaction) => {
              const userReacted = reaction.userIds.includes(user?.id || "");
              return (
                <button
                  key={reaction.emoji}
                  onClick={() => handleReactionToggle(reaction.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    userReacted
                      ? "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="font-medium">{reaction.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread replies link */}
        {(message._count?.replies ?? 0) > 0 && (
          <button
            onClick={() => openThread(message.id)}
            className="mt-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            {message._count!.replies} resposta
            {message._count!.replies > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence>
        {hovered && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute -top-3 right-2 flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-sm px-1 py-0.5"
          >
            {/* Emoji */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
                title="Reagir"
              >
                <Smile className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 bottom-full mb-2 z-50"
                  >
                    {/* Quick-pick common emojis */}
                    <div className="flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-lg px-1.5 py-1 mb-1">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleReactionToggle(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-neutral-100 rounded-md transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                      <div className="w-px h-5 bg-neutral-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => setShowFullPicker(!showFullPicker)}
                        className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-100 rounded-md transition-colors"
                        title="Mais emojis"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Full emoji picker (expandable) */}
                    <AnimatePresence>
                      {showFullPicker && (
                        <EmojiPicker
                          onSelect={(emoji) => {
                            addReaction.mutate({
                              channelId,
                              messageId: message.id,
                              emoji,
                            });
                            setShowEmojiPicker(false);
                            setShowFullPicker(false);
                          }}
                          onClose={() => {
                            setShowEmojiPicker(false);
                            setShowFullPicker(false);
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reply (thread) */}
            <button
              onClick={() => openThread(message.id)}
              className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
              title="Responder em thread"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Pin */}
            <button
              onClick={handlePin}
              className={`p-1.5 hover:bg-neutral-100 rounded transition-colors ${
                message.isPinned ? "text-amber-500" : "text-neutral-500"
              }`}
              title={message.isPinned ? "Desafixar" : "Fixar"}
            >
              <Pin className="w-4 h-4" />
            </button>

            {/* More menu (edit/delete for own messages) */}
            {isOwnMessage && (
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-1.5 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
                  title="Mais"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 w-36 z-50"
                    >
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditContent(message.content);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
