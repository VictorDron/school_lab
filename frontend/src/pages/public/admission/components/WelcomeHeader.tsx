import type { AdmissionTranslations } from '../translations';

interface WelcomeHeaderProps {
  familyName: string;
  t: AdmissionTranslations;
}

export function WelcomeHeader({ familyName, t }: WelcomeHeaderProps) {
  if (!familyName) {
    return (
      <div className="text-center mb-5 sm:mb-6">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
          {t.formTitle}
        </h2>
        <p className="text-neutral-500 text-sm">{t.schoolYear}</p>
      </div>
    );
  }

  return (
    <div className="text-center mb-5 sm:mb-6">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 mb-1 px-2">
        {t.welcomeMessage} <span className="text-primary-600 break-words">{familyName}</span>!
      </h2>
      <p className="text-neutral-600 text-sm mb-2">{t.welcomeSubtitle}</p>
      <p className="text-neutral-400 text-xs">
        {t.formTitle} • {t.schoolYear}
      </p>
    </div>
  );
}
