import { useEffect, type MutableRefObject } from 'react';
import type { UseFormReset } from 'react-hook-form';
import {
  defaultStudentData,
  type AdmissionForm,
  type StudentFormData,
} from '@/components/public/admission/types';
import { defaultAdmissionValues } from './constants';

interface LockedFields {
  desiredGrade: boolean;
  source: boolean;
}

interface UseAdmissionPrefillParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prefillData: any;
  serverDraft: unknown;
  /** Shared with useAdmissionDraft so server-draft restore and prefill don't both fire. */
  hasPrefilled: MutableRefObject<boolean>;
  reset: UseFormReset<AdmissionForm>;
  setLockedFields: (value: LockedFields) => void;
  setFamilyName: (value: string) => void;
}

/**
 * One-shot prefill of the admission form from server-fetched application
 * data. Only runs when the prefill query has resolved AND no server draft
 * was restored, AND the form hasn't already been populated. Maps the
 * heterogeneous server shape (legacy `children` vs. modern `students`)
 * into the wizard's per-student structure.
 */
export function useAdmissionPrefill({
  prefillData,
  serverDraft,
  hasPrefilled,
  reset,
  setLockedFields,
  setFamilyName,
}: UseAdmissionPrefillParams): void {
  useEffect(() => {
    if (prefillData && !serverDraft && !hasPrefilled.current) {
      hasPrefilled.current = true;

      const applicantStudents = prefillData.students?.length > 0
        ? prefillData.students
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        : (prefillData.children?.filter((c: any) => c.isApplicant || c.relationship === 'STUDENT') || []);

      const child = applicantStudents[0] || prefillData.children?.[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const siblingChildren = prefillData.children?.filter((c: any) =>
        c.relationship === 'SIBLING' && !c.isApplicant
      ) || [];

      const hasSource = !!prefillData.source;

      setLockedFields({
        desiredGrade: false,
        source: hasSource,
      });

      if (prefillData.familyName) {
        setFamilyName(prefillData.familyName);
      }

      const prefillStudents: StudentFormData[] = applicantStudents.length > 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? applicantStudents.map((s: any) => ({
            studentType: s.studentType || 'NEW',
            currentGrade: s.currentGrade || s.desiredGrade || '',
            fullName: s.fullName || '',
            dateOfBirth: (s.dateOfBirth || '')?.split('T')[0] || '',
            gender: s.gender || '',
            nationality: s.nationality || '',
            desiredGrade: s.desiredGrade || prefillData.desiredGrades?.[0] || '',
            primaryLanguage: s.primaryLanguage || (Array.isArray(s.otherLanguages) ? '' : '') || '',
            otherLanguages: Array.isArray(s.otherLanguages) && s.otherLanguages.length > 0
              ? s.otherLanguages
              : s.otherLanguages && typeof s.otherLanguages === 'string'
                ? s.otherLanguages.split(',').map((l: string) => l.trim()).filter(Boolean)
                : [''],
            educationHistory: s.educationHistory?.length > 0
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ? s.educationHistory.map((edu: any) => ({
                  schoolName: edu.schoolName || '',
                  country: edu.country || 'BR',
                  city: edu.city || '',
                  gradesAttended: edu.gradesAttended || '',
                }))
              : [{ schoolName: '', country: 'BR', city: '', gradesAttended: '' }],
            additionalInfo: s.additionalInfo ? {
              hasPsychoEvaluation: s.additionalInfo.hasPsychoEvaluation ? 'YES' : 'NO',
              psychoEvaluationDetails: s.additionalInfo.psychoEvaluationDetails || '',
              hasAcademicSupport: s.additionalInfo.hasAcademicSupport ? 'YES' : 'NO',
              academicSupportDetails: s.additionalInfo.academicSupportDetails || '',
              hasHealthIssues: s.additionalInfo.hasHealthIssues ? 'YES' : 'NO',
              healthIssuesDetails: s.additionalInfo.healthIssuesDetails || '',
              hasAdaptationDifficulty: s.additionalInfo.hasAdaptationDifficulty ? 'YES' : 'NO',
              adaptationDifficultyDetails: s.additionalInfo.adaptationDifficultyDetails || '',
              otherRelevantInfo: s.additionalInfo.otherRelevantInfo || '',
            } : { ...defaultStudentData.additionalInfo },
          }))
        : [{ ...defaultStudentData }];

      reset({
        ...defaultAdmissionValues,
        numberOfStudents: prefillStudents.length,
        students: prefillStudents,
        student: {
          studentType: 'NEW',
          currentGrade: child?.desiredGrade || '',
          fullName: child?.fullName || '',
          dateOfBirth: (child?.dateOfBirth || '')?.split('T')[0] || '',
          gender: child?.gender || '',
          nationality: child?.nationality || '',
          desiredGrade: child?.desiredGrade || prefillData.desiredGrades?.[0] || '',
        },
        father: {
          name: '',
          email: '',
          phone: '',
          cpf: '',
        },
        mother: {
          name: '',
          email: '',
          phone: '',
          cpf: '',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        siblings: siblingChildren.map((s: any) => ({
          name: s.fullName || '',
          cpf: s.cpf || '',
          dateOfBirth: (s.dateOfBirth || '')?.split('T')[0] || '',
          grade: s.desiredGrade || '',
        })),
        languages: {
          studentNative: child?.primaryLanguage || '',
          studentOther: '',
          motherNative: '',
          fatherNative: '',
        },
        source: prefillData.source || 'WEBSITE',
      });
    }
  }, [prefillData, serverDraft, hasPrefilled, reset, setLockedFields, setFamilyName]);
}
