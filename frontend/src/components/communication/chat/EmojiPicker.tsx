import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_MAP: Record<string, string> = {
  thumbsup: '\u{1F44D}',
  heart: '\u{2764}\u{FE0F}',
  laugh: '\u{1F602}',
  fire: '\u{1F525}',
  clap: '\u{1F44F}',
  eyes: '\u{1F440}',
  rocket: '\u{1F680}',
  check: '\u{2705}',
  x: '\u{274C}',
  star: '\u{2B50}',
  wave: '\u{1F44B}',
  pray: '\u{1F64F}',
  party: '\u{1F389}',
  muscle: '\u{1F4AA}',
  hundred: '\u{1F4AF}',
  thinking: '\u{1F914}',
  sparkles: '\u{2728}',
  tada: '\u{1F38A}',
  coffee: '\u{2615}',
  sunglasses: '\u{1F60E}',
  cry: '\u{1F622}',
  angry: '\u{1F621}',
  surprised: '\u{1F632}',
  love_eyes: '\u{1F60D}',
  wink: '\u{1F609}',
  shrug: '\u{1F937}',
  facepalm: '\u{1F926}',
  cool: '\u{1F60E}',
  nerd: '\u{1F913}',
  ok: '\u{1F44C}',
};

const EMOJI_LIST = Object.entries(EMOJI_MAP);

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = filter
    ? EMOJI_LIST.filter(([name]) => name.includes(filter.toLowerCase()))
    : EMOJI_LIST;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-full mb-2 bg-white rounded-xl shadow-lg border border-neutral-200 p-3 w-72 z-50"
    >
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar emoji..."
          className="w-full pl-7 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
        {filtered.map(([name, emoji]) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            title={name}
            className="w-9 h-9 flex items-center justify-center text-xl hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-neutral-400 text-xs py-3">
          Nenhum emoji encontrado
        </p>
      )}
    </motion.div>
  );
}
