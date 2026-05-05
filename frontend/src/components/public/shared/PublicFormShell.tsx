import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { StepIndicator, type StepDef } from './StepIndicator';

interface PublicFormShellProps {
  steps: StepDef[];
  currentStep: number;
  language: 'pt' | 'en';
  completedSteps?: Set<number>;
  onStepClick?: (step: number) => void;

  headerTitle?: string;
  /** Brand image src (logo). When omitted, only the title is rendered. */
  logoSrc?: string;
  onLanguageChange: (lang: 'pt' | 'en') => void;

  fieldErrors?: Record<string, string>;

  onPrev: () => void;
  onNext: (e?: FormEvent) => void;
  onSubmit: (e: FormEvent) => void;

  isSubmitting?: boolean;
  canSubmit?: boolean;

  prevLabel?: string;
  nextLabel?: string;
  submitLabel?: string;

  children: ReactNode;
}

/**
 * Outer chrome shared by the public Admission / Enrollment / Re-enrollment
 * wizards. Owns: language toggle header, step indicator, animated step
 * container, error banner, navigation/submit buttons. Step content is passed
 * via children.
 */
export function PublicFormShell({
  steps,
  currentStep,
  language,
  completedSteps,
  onStepClick,
  headerTitle,
  logoSrc,
  onLanguageChange,
  fieldErrors,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting,
  canSubmit = true,
  prevLabel,
  nextLabel,
  submitLabel,
  children,
}: PublicFormShellProps) {
  const totalSteps = steps.length;
  const isLastStep = currentStep >= totalSteps;
  const errorEntries = fieldErrors ? Object.values(fieldErrors) : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoSrc && <img src={logoSrc} alt="School Lab" className="h-8 w-auto object-contain" />}
            {headerTitle && <p className="text-sm text-neutral-500">{headerTitle}</p>}
          </div>
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                language === 'en' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('pt')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                language === 'pt' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'
              }`}
            >
              PT
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            language={language}
            completedSteps={completedSteps}
            onStepClick={onStepClick}
          />

          <form onSubmit={onSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>

            {errorEntries.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-2">
                  {language === 'pt' ? 'Corrija os erros abaixo:' : 'Please fix the errors below:'}
                </p>
                <ul className="space-y-1">
                  {errorEntries.map((msg, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                {prevLabel ?? (language === 'pt' ? 'Anterior' : 'Previous')}
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={(e) => onNext(e)}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {nextLabel ?? (language === 'pt' ? 'Próximo' : 'Next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !canSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitLabel ?? (language === 'pt' ? 'Enviar' : 'Submit')}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
