import { Clock } from 'lucide-react';
import type { AdmissionTranslations } from '../translations';

interface TokenExpirationBannerProps {
  visible: boolean;
  t: AdmissionTranslations;
}

export function TokenExpirationBanner({ visible, t }: TokenExpirationBannerProps) {
  if (!visible) return null;
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-amber-800">{t.timeLimitedLink}</p>
        <p className="text-sm text-amber-700">{t.completeFormMessage}</p>
      </div>
    </div>
  );
}
