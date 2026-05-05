import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { ReEnrollmentFormData, ReEnrollmentSubmitData } from '@/types/re-enrollment';

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

/**
 * Fetch re-enrollment form data (pre-populated from student/lead records)
 */
export function useReEnrollmentFormData(token: string | null) {
  return useQuery({
    queryKey: ['reEnrollmentForm', token],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/public/re-enrollment/${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw {
          code: result.code || 'ERROR',
          message: result.error || 'Erro ao carregar dados.',
        };
      }

      return result as ApiResponse<ReEnrollmentFormData>;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Submit re-enrollment confirmation form
 */
export function useSubmitReEnrollmentForm(token: string | null) {
  return useMutation({
    mutationFn: async (data: ReEnrollmentSubmitData) => {
      const response = await fetch(`${API_URL}/public/re-enrollment/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw {
          code: result.code || 'ERROR',
          message: result.error || 'Erro ao enviar formulário.',
        };
      }

      return result as ApiResponse<{ success: true; inviteId: string }>;
    },
    onSuccess: () => {
      toast.success('Formulário confirmado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao enviar formulário.');
    },
  });
}
