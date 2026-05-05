import { useCallback } from 'react';
import type {
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import type {
  EnrollmentPrefilledData,
  FinancialResponsible,
} from '@/types/enrollment';
import type { EnrollmentForm } from './types';
import { validateStudentStep } from './validators/validateStudentStep';
import { validateHealthStep } from './validators/validateHealthStep';
import { validateTransportStep } from './validators/validateTransportStep';
import { validateFinancialStep } from './validators/validateFinancialStep';
import { validateDocumentsStep } from './validators/validateDocumentsStep';
import { validateTermsStep } from './validators/validateTermsStep';
import type { ValidatorContext } from './validators/types';

interface UseStepValidationParams {
  watch: UseFormWatch<EnrollmentForm>;
  setValue: UseFormSetValue<EnrollmentForm>;
  getValues: UseFormGetValues<EnrollmentForm>;
  language: 'pt' | 'en';
  currentStep: number;
  enrollmentStudents: ReadonlyArray<{ id?: string; fullName?: string }>;
  enrollmentData: EnrollmentPrefilledData | undefined;
  activeStudentTab: number;
  setActiveStudentTab: (index: number) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  watchFinancialResponsible: FinancialResponsible | undefined;
}

interface UseStepValidationReturn {
  validateCurrentStep: () => boolean;
}

const VALIDATORS: Record<number, (ctx: ValidatorContext) => boolean> = {
  1: validateStudentStep,
  2: validateHealthStep,
  3: validateTransportStep,
  4: validateFinancialStep,
  5: validateDocumentsStep,
  6: validateTermsStep,
};

/**
 * Per-step validation dispatcher for the public enrollment wizard. Each step
 * has its own validator under ./validators that owns the field-by-field rules,
 * tab switching for multi-child cases, and the toast/scroll side effects.
 */
export function useStepValidation({
  watch,
  setValue,
  getValues,
  language,
  currentStep,
  enrollmentStudents,
  enrollmentData,
  activeStudentTab,
  setActiveStudentTab,
  setFieldErrors,
  watchFinancialResponsible,
}: UseStepValidationParams): UseStepValidationReturn {
  const validateCurrentStep = useCallback((): boolean => {
    const validator = VALIDATORS[currentStep];
    if (!validator) return true;

    return validator({
      watch,
      setValue,
      getValues,
      language,
      enrollmentStudents,
      enrollmentData,
      activeStudentTab,
      setActiveStudentTab,
      setFieldErrors,
      watchFinancialResponsible,
    });
  }, [
    currentStep,
    enrollmentStudents,
    enrollmentData,
    activeStudentTab,
    setActiveStudentTab,
    setFieldErrors,
    watchFinancialResponsible,
    getValues,
    setValue,
    watch,
    language,
  ]);

  return { validateCurrentStep };
}
