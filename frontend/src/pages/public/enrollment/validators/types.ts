import type {
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import type {
  EnrollmentPrefilledData,
  FinancialResponsible,
} from '@/types/enrollment';
import type { EnrollmentForm } from '../types';

export interface ValidatorContext {
  watch: UseFormWatch<EnrollmentForm>;
  setValue: UseFormSetValue<EnrollmentForm>;
  getValues: UseFormGetValues<EnrollmentForm>;
  language: 'pt' | 'en';
  enrollmentStudents: ReadonlyArray<{ id?: string; fullName?: string }>;
  enrollmentData: EnrollmentPrefilledData | undefined;
  activeStudentTab: number;
  setActiveStudentTab: (index: number) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  watchFinancialResponsible: FinancialResponsible | undefined;
}
