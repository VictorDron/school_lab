import { useCallback, useEffect } from 'react';
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import type { UseMutationResult } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { scrollToFirstError } from '@/utils/validation';
import { defaultStudentData } from '@/components/public/admission/types';
import type { AdmissionForm } from '@/components/public/admission/types';
import { API_URL } from './constants';
import type { AdmissionLanguage, AdmissionTranslations } from './translations';

interface UseAdmissionFormHandlersParams {
  getValues: UseFormGetValues<AdmissionForm>;
  setValue: UseFormSetValue<AdmissionForm>;
  applicationToken: string | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  activeStudentTab: number;
  setActiveStudentTab: (tab: number) => void;
  watchedNumberOfStudents: number;
  language: AdmissionLanguage;
  t: AdmissionTranslations;
  validateStep: (step: number) => Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitMutation: UseMutationResult<any, unknown, AdmissionForm, unknown>;
}

interface UseAdmissionFormHandlersReturn {
  handleNumberOfStudentsChange: (newCount: number) => void;
  handleStepClick: (stepId: number) => void;
  handleNext: () => Promise<void>;
  handlePrevious: () => void;
  onSubmit: (data: AdmissionForm) => void;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Owns the user-driven form transitions: stepping forward/back, jumping
 * to a step, growing/shrinking the students array (with the destructive-
 * confirmation prompt), and the final submit pre-validation that toasts
 * a localized list of missing fields and sends the user back to the
 * offending step before firing the mutation.
 */
export function useAdmissionFormHandlers({
  getValues,
  setValue,
  applicationToken,
  currentStep,
  setCurrentStep,
  activeStudentTab,
  setActiveStudentTab,
  watchedNumberOfStudents,
  language,
  t,
  validateStep,
  submitMutation,
}: UseAdmissionFormHandlersParams): UseAdmissionFormHandlersReturn {
  const handleNumberOfStudentsChange = useCallback(
    (newCount: number) => {
      const currentStudents = getValues('students') || [];
      if (newCount < currentStudents.length) {
        const hasData = currentStudents.slice(newCount).some(
          (s) => s.fullName?.trim() || s.dateOfBirth || s.desiredGrade
        );
        if (hasData && !window.confirm(t.confirmReduceStudents)) {
          setValue('numberOfStudents', currentStudents.length);
          return;
        }
        setValue('students', currentStudents.slice(0, newCount));
        if (activeStudentTab >= newCount) {
          setActiveStudentTab(newCount - 1);
        }
      } else if (newCount > currentStudents.length) {
        for (let i = currentStudents.length; i < newCount; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue(`students.${i}` as any, { ...defaultStudentData });
        }
      }
    },
    [getValues, setValue, activeStudentTab, setActiveStudentTab, t.confirmReduceStudents]
  );

  // Grow students array when watchedNumberOfStudents increases (e.g. via prefill)
  useEffect(() => {
    const currentStudents = getValues('students') || [];
    const targetCount = watchedNumberOfStudents || 1;
    if (targetCount > currentStudents.length) {
      for (let i = currentStudents.length; i < targetCount; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(`students.${i}` as any, { ...defaultStudentData });
      }
    }
  }, [watchedNumberOfStudents, getValues, setValue]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      setCurrentStep(stepId);
      scrollToTop();
    },
    [setCurrentStep]
  );

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (!isValid) {
      scrollToFirstError();
      return;
    }
    if (currentStep < 4) {
      const nextStepValue = currentStep + 1;
      setCurrentStep(nextStepValue);
      scrollToTop();

      if (applicationToken) {
        fetch(`${API_URL}/public/form-draft/${applicationToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: 'ADMISSION',
            data: getValues(),
            step: nextStepValue,
          }),
        }).catch(() => {});
      }
    }
  }, [validateStep, currentStep, setCurrentStep, applicationToken, getValues]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  }, [currentStep, setCurrentStep]);

  const onSubmit = useCallback(
    (data: AdmissionForm) => {
      if (submitMutation.isPending) return;

      const missingFields: string[] = [];

      const students = data.students || [];
      let hasStudentError = false;
      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const label = students.length > 1 ? ` (${s.fullName || `${t.studentTab} ${i + 1}`})` : '';
        if (!s.fullName || s.fullName.trim().length < 2) {
          missingFields.push(`${t.fullName}${label}`);
          hasStudentError = true;
        }
        if (!s.dateOfBirth) {
          missingFields.push(`${t.dateOfBirth}${label}`);
          hasStudentError = true;
        }
        if (!s.gender) {
          missingFields.push(`${t.gender}${label}`);
          hasStudentError = true;
        }
        if (!s.desiredGrade) {
          missingFields.push(`${t.desiredGrade}${label}`);
          hasStudentError = true;
        }
      }

      if (!data.father.name || data.father.name.trim().length < 2) {
        missingFields.push(`${t.fatherInfo} - ${t.name}`);
      }
      if (!data.father.email || !data.father.email.includes('@')) {
        missingFields.push(`${t.fatherInfo} - ${t.email}`);
      }
      if (!data.father.phone || data.father.phone.replace(/\D/g, '').length < 8) {
        missingFields.push(`${t.fatherInfo} - ${t.phone}`);
      }
      if (!data.mother.name || data.mother.name.trim().length < 2) {
        missingFields.push(`${t.motherInfo} - ${t.name}`);
      }
      if (!data.mother.email || !data.mother.email.includes('@')) {
        missingFields.push(`${t.motherInfo} - ${t.email}`);
      }
      if (!data.mother.phone || data.mother.phone.replace(/\D/g, '').length < 8) {
        missingFields.push(`${t.motherInfo} - ${t.phone}`);
      }
      if (!data.address.country) missingFields.push(t.country);
      if (!data.address.city) missingFields.push(t.city);

      if (missingFields.length > 0) {
        const errorMsg =
          language === 'pt'
            ? `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`
            : `Required fields missing: ${missingFields.join(', ')}`;
        toast.error(errorMsg);
        if (hasStudentError) {
          setCurrentStep(1);
        } else if (
          !data.father.name ||
          !data.father.email ||
          !data.father.phone ||
          !data.mother.name ||
          !data.mother.email ||
          !data.mother.phone ||
          !data.address.country ||
          !data.address.city
        ) {
          setCurrentStep(2);
        }
        scrollToFirstError();
        return;
      }

      submitMutation.mutate(data);
    },
    [submitMutation, t, language, setCurrentStep]
  );

  return {
    handleNumberOfStudentsChange,
    handleStepClick,
    handleNext,
    handlePrevious,
    onSubmit,
  };
}
