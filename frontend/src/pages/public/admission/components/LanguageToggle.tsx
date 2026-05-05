import type { AdmissionLanguage } from '../translations';

interface LanguageToggleProps {
  language: AdmissionLanguage;
  setLanguage: (language: AdmissionLanguage) => void;
}

export function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  const baseClass = 'px-3 py-1.5 sm:py-1 text-sm font-medium rounded-md transition-all';
  const activeClass = 'bg-white shadow-sm text-neutral-900';
  const inactiveClass = 'text-neutral-500';

  return (
    <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${baseClass} ${language === 'en' ? activeClass : inactiveClass}`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('pt')}
        className={`${baseClass} ${language === 'pt' ? activeClass : inactiveClass}`}
      >
        PT
      </button>
    </div>
  );
}
