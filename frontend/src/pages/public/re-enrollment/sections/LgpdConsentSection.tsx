import { Shield } from 'lucide-react';
import { SectionCard } from '../components';
import { checkboxClass } from '../types';

interface LgpdConsentSectionProps {
  lgpdConsent: boolean;
  setLgpdConsent: (value: boolean) => void;
}

export function LgpdConsentSection({ lgpdConsent, setLgpdConsent }: LgpdConsentSectionProps) {
  return (
    <SectionCard icon={Shield} title="Termos LGPD">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className={`${checkboxClass} mt-0.5`}
          checked={lgpdConsent}
          onChange={(e) => setLgpdConsent(e.target.checked)}
        />
        <span className="text-sm text-neutral-700 leading-relaxed">
          Li e aceito os termos de proteção de dados (LGPD). Autorizo a Rio International School a processar os dados fornecidos para fins de rematrícula.
        </span>
      </label>
    </SectionCard>
  );
}
