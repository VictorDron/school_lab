import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Paperclip, Smile, X, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSendMessage, useSendThreadReply } from "@/hooks/useMessages";
import { useUserSearch, useAllUsers } from "@/hooks/useUserSearch";
import { startTyping, stopTyping } from "@/lib/socket";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import EmojiPicker from "./EmojiPicker";

interface PendingFile {
  file: File;
  preview?: string;
}

interface MessageInputProps {
  channelId: string;
  parentId?: string;
  channelName?: string;
  isDm?: boolean;
  typingText?: string | null;
}

interface ActiveMention {
  start: number;
  end: number;
  query: string;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getActiveMention(
  value: string,
  cursorPosition: number,
): ActiveMention | null {
  const beforeCursor = value.slice(0, cursorPosition);
  const match = beforeCursor.match(/(?:^|\s)@([^\s@[\]]*)$/);

  if (!match) {
    return null;
  }

  const query = match[1];

  return {
    start: cursorPosition - query.length - 1,
    end: cursorPosition,
    query,
  };
}

export default function MessageInput({
  channelId,
  parentId,
  channelName,
  isDm,
  typingText,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeMention, setActiveMention] = useState<ActiveMention | null>(
    null,
  );
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingRef = useRef<number>(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: allUsers = [] } = useAllUsers();
  const { data: searchResults = [] } = useUserSearch(activeMention?.query || "");
  const sendMessage = useSendMessage();
  const sendThreadReply = useSendThreadReply();

  // Cleanup typing timeout on unmount or channel change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  const updateMentionFromCursor = useCallback(
    (value: string, cursorPosition?: number | null) => {
      if (cursorPosition === undefined || cursorPosition === null) {
        setActiveMention(null);
        return;
      }

      setActiveMention(getActiveMention(value, cursorPosition));
      setSelectedMentionIndex(0);
    },
    [],
  );

  const mentionSuggestions = activeMention
    ? (activeMention.query.length >= 1 ? searchResults : allUsers).slice(0, 8)
    : [];

  const showMentionSuggestions = !!activeMention && mentionSuggestions.length > 0;

  const insertMention = useCallback(
    (displayName: string) => {
      if (!activeMention) return;

      const nextContent =
        content.slice(0, activeMention.start) +
        `@[${displayName}] ` +
        content.slice(activeMention.end);

      setContent(nextContent);
      setActiveMention(null);
      setSelectedMentionIndex(0);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        const nextCursor = activeMention.start + displayName.length + 4;
        el.focus();
        el.selectionStart = nextCursor;
        el.selectionEnd = nextCursor;
      });
    },
    [activeMention, content],
  );

  // Handle typing indicator emission (throttled to max once per 2 seconds)
  const emitTyping = useCallback(() => {
    if (!channelId) return;

    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      startTyping(channelId);
      lastTypingRef.current = now;
    }

    // Reset stop-typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(channelId);
    }, 2000);
  }, [channelId]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);
      updateMentionFromCursor(e.target.value, e.target.selectionStart);
      emitTyping();
    },
    [updateMentionFromCursor, emitTyping],
  );

  // File handling
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: PendingFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pf: PendingFile = { file };
      if (file.type.startsWith("image/")) {
        pf.preview = URL.createObjectURL(file);
      }
      newFiles.push(pf);
    }
    setPendingFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > 5) {
        toast.error(`Máximo de 5 arquivos por mensagem. ${combined.length - 5} arquivo(s) removido(s).`);
        // Revoke previews of excess files
        for (const pf of combined.slice(5)) {
          if (pf.preview) URL.revokeObjectURL(pf.preview);
        }
        return combined.slice(0, 5);
      }
      return combined;
    });
  }, []);

  const removePendingFile = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      if (next[index]?.preview) URL.revokeObjectURL(next[index].preview!);
      next.splice(index, 1);
      return next;
    });
  }, []);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed && pendingFiles.length === 0) return;

    // Stop typing on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(channelId);

    // Clear input immediately for better UX
    const savedContent = trimmed;
    const savedFiles = [...pendingFiles];
    setContent("");
    setPendingFiles([]);
    setActiveMention(null);
    setSelectedMentionIndex(0);

    // Upload files if any
    let attachments: Array<{ name: string; url: string; type: string; size: number }> | undefined;
    if (savedFiles.length > 0) {
      const formData = new FormData();
      for (const pf of savedFiles) {
        formData.append("files", pf.file);
      }
      setUploading(true);
      try {
        const response = await api.post(`/channels/${channelId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        attachments = response.data?.data;
      } catch {
        toast.error("Falha ao enviar arquivos. Tente novamente.");
        setContent(savedContent);
        setPendingFiles(savedFiles);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const messageContent = savedContent || " ";
    const onError = () => { setContent(savedContent); };

    if (parentId) {
      sendThreadReply.mutate(
        { channelId, messageId: parentId, content: messageContent, attachments },
        { onError },
      );
    } else {
      sendMessage.mutate(
        { channelId, content: messageContent, attachments },
        { onError },
      );
    }

    // Cleanup file previews
    for (const pf of savedFiles) {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (mentionSuggestions.length > 0) {
          setSelectedMentionIndex(
            (prev) => (prev + 1) % mentionSuggestions.length,
          );
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (mentionSuggestions.length > 0) {
          setSelectedMentionIndex((prev) =>
            prev === 0 ? mentionSuggestions.length - 1 : prev - 1,
          );
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setActiveMention(null);
        return;
      }

      if (
        e.key === "Enter" &&
        !e.ctrlKey &&
        !e.shiftKey &&
        mentionSuggestions.length > 0
      ) {
        e.preventDefault();
        insertMention(
          mentionSuggestions[selectedMentionIndex].displayName,
        );
        return;
      }
    }

    // Enter to send (Shift+Enter for newline)
    if (e.key === "Enter" && !e.shiftKey && !showMentionSuggestions) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const newContent = content.slice(0, start) + emoji + content.slice(end);
        setContent(newContent);
        // Focus and move cursor after emoji
        requestAnimationFrame(() => {
          el.focus();
          el.selectionStart = el.selectionEnd = start + emoji.length;
          updateMentionFromCursor(newContent, start + emoji.length);
        });
      } else {
        setContent((prev) => prev + emoji);
      }
    },
    [content, updateMentionFromCursor],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const isPending = sendMessage.isPending || sendThreadReply.isPending || uploading;

  const placeholder = parentId
    ? "Responder na thread..."
    : channelName
      ? isDm
        ? `Mensagem para ${channelName}`
        : `Mensagem em #${channelName}`
      : "Escreva uma mensagem...";

  return (
    <div className="border-t border-neutral-200 bg-white">
      <div className="p-3" onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="relative">
          {/* Mention suggestions */}
          {showMentionSuggestions && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden z-50">
              {mentionSuggestions.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(user.displayName);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                    index === selectedMentionIndex
                      ? "bg-primary-50"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.displayName}
                    size="xs"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {user.displayName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {user.email}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 capitalize">{user.role?.toLowerCase()}</span>
                </button>
              ))}
            </div>
          )}

          {/* Pending files preview */}
          <AnimatePresence>
            {pendingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 flex flex-wrap gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200"
              >
                {pendingFiles.map((pf, idx) => (
                  <div key={idx} className="relative group">
                    {pf.preview ? (
                      <img src={pf.preview} alt={pf.file.name} className="w-16 h-16 rounded-lg object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingFile(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-[10px] text-neutral-500 truncate w-16 mt-0.5 text-center">{pf.file.name}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-200 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 transition-all">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ""; }}
            />

            {/* Attachment */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors flex-shrink-0"
              title="Anexar arquivo"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text area */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onClick={(e) =>
                updateMentionFromCursor(
                  e.currentTarget.value,
                  e.currentTarget.selectionStart,
                )
              }
              onKeyUp={(e) =>
                updateMentionFromCursor(
                  e.currentTarget.value,
                  e.currentTarget.selectionStart,
                )
              }
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-sm resize-none max-h-40 leading-relaxed py-1"
            />

            {/* Emoji */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={handleEmojiSelect}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Send */}
            <button
              type="button"
              onClick={handleSend}
              disabled={(!content.trim() && pendingFiles.length === 0) || isPending}
              className="p-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title="Enviar (Enter)"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Typing indicator / hint area */}
        <div className="h-5 px-2 mt-1">
          <p className="text-xs text-neutral-400">
            {typingText
              ? <span className="text-primary-500 italic">{typingText}</span>
              : showMentionSuggestions
                ? "Enter para selecionar, Esc para fechar"
                : "Enter para enviar. Shift+Enter para nova linha. @ para mencionar."}
          </p>
        </div>
      </div>
    </div>
  );
}
