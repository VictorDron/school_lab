import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import type { AdmissionForm } from '@/components/public/admission/types';
import { API_URL } from './constants';

interface UseAdmissionSubmitParams {
  applicationToken: string | null;
  /** Localized "expired token" message used as the rejection reason. */
  expiredMessage: string;
  setTokenError: (value: 'expired' | 'invalid' | null) => void;
  markSubmitted: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdmissionSubmitMutation = UseMutationResult<any, unknown, AdmissionForm, unknown>;

interface UseAdmissionSubmitReturn {
  submitMutation: AdmissionSubmitMutation;
}

/**
 * Owns the admission submission mutation: payload shaping, the POST to
 * /public/admissions, server error mapping (TOKEN_EXPIRED → tokenError),
 * and post-success cleanup via markSubmitted. The page keeps its own
 * onSubmit field-level guard because that logic leans on the localized
 * label map; this hook is only the network boundary.
 */
export function useAdmissionSubmit({
  applicationToken,
  expiredMessage,
  setTokenError,
  markSubmitted,
}: UseAdmissionSubmitParams): UseAdmissionSubmitReturn {
  const submitMutation = useMutation({
    mutationFn: async (data: AdmissionForm) => {
      const studentsPayload = (data.students || []).map((student) => ({
        fullName: student.fullName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        nationality: student.nationality,
        desiredGrade: student.desiredGrade,
        currentGrade: student.currentGrade,
        studentType: student.studentType,
        primaryLanguage: student.primaryLanguage || data.languages.studentNative,
        otherLanguages: (Array.isArray(student.otherLanguages)
          ? student.otherLanguages.filter(Boolean).join(',')
          : student.otherLanguages) || data.languages.studentOther || '',
        educationHistory: (student.educationHistory || [])
          .filter(e => e.schoolName?.trim())
          .map(e => ({
            schoolName: e.schoolName,
            country: e.country || '',
            city: e.city || '',
            gradesAttended: e.gradesAttended || '',
          })),
        additionalInfo: student.additionalInfo ? {
          hasPsychoEvaluation: student.additionalInfo.hasPsychoEvaluation === 'YES',
          psychoEvaluationDetails: student.additionalInfo.psychoEvaluationDetails || '',
          hasAcademicSupport: student.additionalInfo.hasAcademicSupport === 'YES',
          academicSupportDetails: student.additionalInfo.academicSupportDetails || '',
          hasHealthIssues: student.additionalInfo.hasHealthIssues === 'YES',
          healthIssuesDetails: student.additionalInfo.healthIssuesDetails || '',
          hasAdaptationDifficulty: student.additionalInfo.hasAdaptationDifficulty === 'YES',
          adaptationDifficultyDetails: student.additionalInfo.adaptationDifficultyDetails || '',
          otherRelevantInfo: student.additionalInfo.otherRelevantInfo || '',
        } : undefined,
      }));

      const payload = {
        students: studentsPayload,
        livesWith: data.livesWith === 'BOTH' ? 'BOTH_PARENTS' :
                   data.livesWith === 'FATHER' ? 'FATHER_ONLY' :
                   data.livesWith === 'MOTHER' ? 'MOTHER_ONLY' : 'GUARDIAN',
        guardianInfo: data.livesWith === 'GUARDIAN' ? (data.students?.[0]?.additionalInfo?.otherRelevantInfo || data.additionalInfo?.otherRelevantInfo) : undefined,
        notificationPreference: data.notificationPreference || undefined,
        father: {
          name: data.father.name,
          email: data.father.email,
          phone: data.father.phone,
          cpf: data.father.cpf || '',
          occupation: '',
          nativeLanguage: data.languages.fatherNative || '',
        },
        mother: {
          name: data.mother.name,
          email: data.mother.email,
          phone: data.mother.phone,
          cpf: data.mother.cpf || '',
          occupation: '',
          nativeLanguage: data.languages.motherNative || '',
        },
        address: {
          country: data.address.country,
          state: data.address.state,
          city: data.address.city,
          neighborhood: data.address.neighborhood,
          street: data.address.street,
          number: data.address.number,
          complement: data.address.complement,
          zipCode: data.address.zipCode,
        },
        siblings: data.siblings
          .filter(s => s.name?.trim())
          .map(s => ({
            name: s.name,
            cpf: s.cpf || '',
            dateOfBirth: s.dateOfBirth || '',
            grade: s.grade || '',
          })),
        source: data.source,
        applicationToken: applicationToken || undefined,
      };

      const response = await fetch(`${API_URL}/public/admissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        if (json.code === 'TOKEN_EXPIRED') {
          setTokenError('expired');
          throw new Error(expiredMessage);
        }
        if (json.details) {
          console.error('Validation errors:', json.details);
        }
        throw new Error(json.error || 'Erro ao enviar inscrição');
      }

      return json;
    },
    onSuccess: () => {
      markSubmitted();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : getErrorMessage(error));
    },
  });

  return { submitMutation };
}
