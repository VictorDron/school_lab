import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguageStore } from '@/stores/languageStore';

export default function AuthLayout() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex flex-col">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-soft border border-neutral-200">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            language === 'en'
              ? 'bg-primary-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('pt')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            language === 'pt'
              ? 'bg-primary-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          PT
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-neutral-500">
        <p>© {new Date().getFullYear()} RISYS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
