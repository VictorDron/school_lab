import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Mark from '@/components/brand/Mark';
import { useLanguageStore } from '@/stores/languageStore';

export default function AuthLayout() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen bg-paper grain flex flex-col relative">
      {/* Top bar */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-rule">
        <Link to="/" aria-label="agente school">
          <Mark size="sm" />
        </Link>

        <div className="flex items-center gap-1 border border-ink" style={{ borderRadius: 4 }}>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-all ${
              language === 'en' ? 'bg-ink text-paper' : 'text-stone-deep hover:text-ink'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('pt')}
            className={`px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition-all ${
              language === 'pt' ? 'bg-ink text-paper' : 'text-stone-deep hover:text-ink'
            }`}
          >
            PT
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px]"
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-stone-deep border-t border-rule">
        © {new Date().getFullYear()} · agente school <span className="text-iris">●</span>
      </footer>
    </div>
  );
}
