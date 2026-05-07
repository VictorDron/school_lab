import { Link, useLocation } from 'react-router-dom';

interface SubNavItem {
  to: string;
  label: string;
  /** Optional sub-paths that should also activate this item. Defaults to `to`. */
  match?: string[];
}

interface Props {
  items: SubNavItem[];
}

/**
 * Editorial sub-nav rendered inside a module shell.
 *
 * Style: mono uppercase tabs with a 1px hairline below, iris underline on
 * the active item. Aligns with the agente school DOT · Iris brand manual.
 */
export default function ModuleSubNav({ items }: Props) {
  const { pathname } = useLocation();

  return (
    <nav className="bg-paper border-b border-rule">
      <div className="px-6 lg:px-12 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {items.map((it) => {
          const matchPaths = it.match ?? [it.to];
          const active = matchPaths.some((m) => pathname === m || pathname.startsWith(m + '/'));
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                'relative px-4 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap transition-colors',
                active ? 'text-ink' : 'text-stone-deep hover:text-ink',
              ].join(' ')}
            >
              {it.label}
              {active && (
                <span
                  aria-hidden
                  className="absolute left-3 right-3 -bottom-px h-[2px]"
                  style={{ background: 'var(--iris)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
