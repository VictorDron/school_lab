import { useCallback } from 'react';
import toast from 'react-hot-toast';
import type {
  UseFormGetValues,
  UseFormTrigger,
} from 'react-hook-form';
import { isFirstSchoolGrade, isMayBeFirstSchoolGrade } from '@/constants/grades';
import type { AdmissionForm } from '@/components/public/admission/types';

interface UseAdmissionStepValidationParams {
  getValues: UseFormGetValues<AdmissionForm>;
  trigger: UseFormTrigger<AdmissionForm>;
  language: 'pt' | 'en';
  setActiveStudentTab: (index: number) => void;
  /** Translation for "Filho" / "Child" — drives multi-child error labels. */
  studentTabLabel: string;
}

interface UseAdmissionStepValidationReturn {
  /**
   * Run RHF trigger() over the field set required for the given step,
   * plus extra cross-cutting checks (multi-student tab focusing,
   * duplicate CPF detection on step 2). Returns false on any failure
   * and surfaces a toast pointing the user at the first offender.
   */
  validateStep: (step: number) => Promise<boolean>;
}

/**
 * Per-step validator for the public admission wizard. Pulled from the
 * page so it can be tested in isolation and so the page-level handlers
 * (handleNext, handleStepClick) stay focused on navigation.
 */
export function useAdmissionStepValidation({
  getValues,
  trigger,
  language,
  setActiveStudentTab,
  studentTabLabel,
}: UseAdmissionStepValidationParams): UseAdmissionStepValidationReturn {
  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    const fieldsToValidate: (keyof AdmissionForm | string)[] = [];
    const numStudents = getValues('numberOfStudents') || 1;

    switch (step) {
      case 1:
        for (let i = 0; i < numStudents; i++) {
          fieldsToValidate.push(
            `students.${i}.studentType`,
            `students.${i}.fullName`,
            `students.${i}.dateOfBirth`,
            `students.${i}.gender`,
            `students.${i}.desiredGrade`
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studentDesiredGrade = getValues(`students.${i}.desiredGrade` as any);
          if (studentDesiredGrade && !isFirstSchoolGrade(studentDesiredGrade)) {
            fieldsToValidate.push(`students.${i}.currentGrade`);
          }
        }
        break;
      case 2: {
        fieldsToValidate.push(
          'father.name',
          'father.cpf',
          'father.email',
          'father.phone',
          'mother.name',
          'mother.cpf',
          'mother.email',
          'mother.phone',
          'address.zipCode',
          'address.street',
          'address.number',
          'address.neighborhood',
          'address.city',
          'address.state',
          'address.country'
        );
        const siblings = getValues('siblings') || [];
        for (let i = 0; i < siblings.length; i++) {
          fieldsToValidate.push(
            `siblings.${i}.name`,
            `siblings.${i}.cpf`,
            `siblings.${i}.dateOfBirth`,
            `siblings.${i}.grade`
          );
        }
        break;
      }
      case 3:
        for (let i = 0; i < numStudents; i++) {
          fieldsToValidate.push(`students.${i}.primaryLanguage`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studentGrade = getValues(`students.${i}.desiredGrade` as any);
          if (!isFirstSchoolGrade(studentGrade) && !isMayBeFirstSchoolGrade(studentGrade)) {
            fieldsToValidate.push(`students.${i}.educationHistory.0.schoolName`);
          }
        }
        fieldsToValidate.push(
          'languages.motherNative',
          'languages.fatherNative'
        );
        break;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await trigger(fieldsToValidate as any);

    if (step === 1) {
      const students = getValues('students') || [];
      for (let i = 0; i < numStudents; i++) {
        const s = students[i];
        const needsCurrentGrade = s?.desiredGrade && !isFirstSchoolGrade(s.desiredGrade);
        if (!s || !s.fullName?.trim() || !s.dateOfBirth || !s.gender || !s.desiredGrade || !s.studentType || (needsCurrentGrade && !s.currentGrade)) {
          setActiveStudentTab(i);
          const label = numStudents > 1 ? ` (${s?.fullName?.trim() || `${studentTabLabel} ${i + 1}`})` : '';
          toast.error(
            language === 'pt'
              ? `Preencha todos os campos obrigatórios do aluno${label}`
              : `Please fill all required fields for student${label}`
          );
          return false;
        }
      }
    }

    if (step === 3) {
      const students = getValues('students') || [];
      for (let i = 0; i < numStudents; i++) {
        const s = students[i];
        if (!s?.primaryLanguage) {
          setActiveStudentTab(i);
          const label = numStudents > 1 ? ` (${s?.fullName?.trim() || `${studentTabLabel} ${i + 1}`})` : '';
          toast.error(
            language === 'pt'
              ? `Preencha o idioma principal do aluno${label}`
              : `Please select the primary language for student${label}`
          );
          return false;
        }
        const studentGrade = s.desiredGrade;
        if (!isFirstSchoolGrade(studentGrade) && !isMayBeFirstSchoolGrade(studentGrade)) {
          if (!s.educationHistory?.[0]?.schoolName?.trim()) {
            setActiveStudentTab(i);
            const label = numStudents > 1 ? ` (${s?.fullName?.trim() || `${studentTabLabel} ${i + 1}`})` : '';
            toast.error(
              language === 'pt'
                ? `Preencha o histórico escolar do aluno${label}`
                : `Please fill the education history for student${label}`
            );
            return false;
          }
        }
      }
    }

    if (!result && (step === 1 || step === 3)) {
      for (let i = 0; i < numStudents; i++) {
        const hasError = await trigger(
          step === 1
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? [`students.${i}.fullName`, `students.${i}.desiredGrade`] as any
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : [`students.${i}.primaryLanguage`] as any
        );
        if (!hasError) {
          setActiveStudentTab(i);
          break;
        }
      }
    }

    // Duplicate CPF check for step 2
    if (step === 2 && result) {
      const normCpf = (v: string | undefined | null) => v?.replace(/\D/g, '') || '';
      const cpfEntries: { label: string; value: string }[] = [];

      const fatherCpf = normCpf(getValues('father.cpf'));
      if (fatherCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF do pai' : 'Father CPF', value: fatherCpf });

      const motherCpf = normCpf(getValues('mother.cpf'));
      if (motherCpf) cpfEntries.push({ label: language === 'pt' ? 'CPF da mãe' : 'Mother CPF', value: motherCpf });

      const siblingsVal = getValues('siblings') || [];
      for (let i = 0; i < siblingsVal.length; i++) {
        const sCpf = normCpf(siblingsVal[i]?.cpf);
        if (sCpf) cpfEntries.push({
          label: language === 'pt' ? `CPF do irmão ${i + 1}` : `Sibling ${i + 1} CPF`,
          value: sCpf,
        });
      }

      for (let a = 0; a < cpfEntries.length; a++) {
        for (let b = a + 1; b < cpfEntries.length; b++) {
          if (cpfEntries[a].value === cpfEntries[b].value) {
            toast.error(
              language === 'pt'
                ? `${cpfEntries[a].label} é igual ao ${cpfEntries[b].label}`
                : `${cpfEntries[a].label} is the same as ${cpfEntries[b].label}`
            );
            return false;
          }
        }
      }
    }

    return result ?? true;
  }, [getValues, trigger, language, setActiveStudentTab, studentTabLabel]);

  return { validateStep };
}
