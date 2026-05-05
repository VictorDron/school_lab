import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, X, ArrowDown, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSearchMessages } from '@/hooks/useMessages';
import { useCommunicationStore } from '@/stores/communicationStore';
import { Avatar } from '@/components/ui/Avatar';
import type { Message } from '@/types/communication';

interface MessageSearchPanelProps {
  channelId: string;
}

function highlightMatch(text: string, query: string): React.ReactNode[] {
  if (!query.trim()) return [text];
  const parts: React.ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQuery, lastIndex);
  let key = 0;

  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <mark key={key++} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function MessageSearchPanel({ channelId }: MessageSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleSearch } = useCommunicationStore();

  // Debounce the search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Server-side search via React Query
  const { data: searchData, isLoading: isSearching } = useSearchMessages(channelId, debouncedQuery);

  const searchResults: Message[] = searchData?.data || [];

  // Scroll to a message in the chat
  const handleResultClick = useCallback((messageId: string) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Briefly highlight the message
      el.classList.add('ring-2', 'ring-primary-400', 'ring-offset-1');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary-400', 'ring-offset-1');
      }, 2000);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
      className="absolute top-14 right-0 z-40 w-[calc(100vw-2rem)] sm:w-96 max-h-[28rem] bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden flex flex-col"
    >
      {/* Search Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
        <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar mensagens..."
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-0.5 hover:bg-neutral-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        )}
        <button
          onClick={toggleSearch}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
          title="Fechar pesquisa"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {debouncedQuery.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">Digite ao menos 2 caracteres para pesquisar</p>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary-500" />
            <p className="text-sm">Pesquisando...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
            <p className="text-sm">Nenhuma mensagem encontrada</p>
          </div>
        ) : (
          <div className="py-1">
            <p className="px-4 py-1.5 text-xs font-medium text-neutral-500">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-0.5">
              {searchResults.map((msg: Message) => (
                <button
                  key={msg.id}
                  onClick={() => handleResultClick(msg.id)}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                >
                  <Avatar
                    src={msg.sender.avatarUrl}
                    name={msg.sender.displayName}
                    size="xs"
                    className="flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-neutral-900 truncate">
                        {msg.sender.displayName}
                      </span>
                      <span className="text-[11px] text-neutral-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-2 mt-0.5">
                      {highlightMatch(msg.content, debouncedQuery)}
                    </p>
                  </div>
                  <ArrowDown className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0 mt-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
