import { Sparkles } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
}

/**
 * Editorial placeholder shown inside a module shell while the area is
 * being built out. Removed once the real page lands.
 */
export default function EmptyModulePlaceholder({ title, subtitle }: Props) {
  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-20">
      <div className="bg-paper border border-ink p-16 lg:p-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] font-semibold uppercase tracking-[0.18em] mb-8" style={{ color: 'var(--iris)', background: 'rgba(107, 79, 255, 0.06)', border: '1px solid rgba(107, 79, 255, 0.2)' }}>
          <Sparkles className="w-3 h-3" />
          Em construção
        </div>

        <h1
          className="font-display font-light leading-none mb-5 text-ink"
          style={{ fontSize: 'clamp(40px, 5vw, 64px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          <em className="display-em">{title}</em>
          <span className="text-iris">.</span>
        </h1>

        {subtitle && (
          <p className="serif-em text-stone-deep max-w-xl mx-auto" style={{ fontSize: 17 }}>
            — {subtitle}
          </p>
        )}

        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-deep mt-12">
          — Esta tela será preenchida em breve
        </p>
      </div>
    </div>
  );
}
