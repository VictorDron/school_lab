import { CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { AdmissionTranslations } from '../translations';

interface FormNavigationProps {
  currentStep: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  t: AdmissionTranslations;
}

export function FormNavigation({
  currentStep,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
  t,
}: FormNavigationProps) {
  const isFirst = currentStep === 1;
  const isLast = currentStep >= 4;

  return (
    <div className="flex items-center justify-between mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-neutral-200 gap-3">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst}
        className={`btn btn-outline btn-md min-w-0 px-3 sm:px-4 ${isFirst ? 'invisible' : ''}`}
      >
        <ChevronLeft className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">{t.previous}</span>
      </button>

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary btn-md flex-1 sm:flex-none sm:min-w-[140px]"
        >
          {t.next}
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn btn-primary btn-md sm:btn-lg flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span className="truncate">{t.submit}</span>
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
