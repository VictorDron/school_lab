import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type {
  EnrollmentPrefilledData,
  EnrollmentFormData,
  EnrollmentDocument,
} from '@/types/enrollment';

const API_URL = import.meta.env.VITE_API_URL;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
}

// ==================== PUBLIC API CALLS ====================

/**
 * Fetch enrollment data with pre-filled values from admission form
 */
export function useEnrollmentData(token: string | null) {
  return useQuery({
    queryKey: ['enrollmentData', token],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/public/enrollment/${token}`);
      const result = await response.json();

      if (!response.ok) {
        throw {
          code: result.code || 'ERROR',
          message: result.error || 'Erro ao carregar dados',
        };
      }

      return result as ApiResponse<EnrollmentPrefilledData>;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Submit enrollment form
 */
export function useSubmitEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const response = await fetch(`${API_URL}/public/enrollment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Build a detailed error message from Zod validation details
        let message = result.error || 'Erro ao enviar matrícula';
        if (result.details && Array.isArray(result.details) && result.details.length > 0) {
          const fieldErrors = result.details
            .slice(0, 3)
            .map((d: { path?: string[] | string; message?: string }) => {
              const pathStr = Array.isArray(d.path) ? d.path.join('.') : d.path;
              return pathStr ? `${pathStr}: ${d.message}` : d.message;
            })
            .join('; ');
          message = `${message} — ${fieldErrors}`;
          if (result.details.length > 3) {
            message += ` (+${result.details.length - 3} mais)`;
          }
        }
        throw {
          code: result.code || 'ERROR',
          message,
        };
      }

      return result as ApiResponse<{ leadCode: string }>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollmentData', variables.enrollmentToken] });
      toast.success('Matrícula enviada com sucesso!');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao enviar matrícula');
    },
  });
}

/**
 * Upload enrollment document with progress tracking
 */
export interface UploadProgress {
  documentType: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  fileName: string;
}

export function useUploadEnrollmentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      file,
      documentType,
      category,
      childId,
      includesOtherDocs,
      onProgress,
    }: {
      token: string;
      file: File;
      documentType: string;
      category: string;
      childId?: string;
      includesOtherDocs?: string[];
      onProgress?: (progress: number) => void;
    }) => {
      return new Promise<ApiResponse<EnrollmentDocument[]>>((resolve, reject) => {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('documentType', documentType);
        formData.append('category', category);
        if (childId) {
          formData.append('childId', childId);
        }
        if (includesOtherDocs && includesOtherDocs.length > 0) {
          formData.append('includesOtherDocs', JSON.stringify(includesOtherDocs));
        }

        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          try {
            const result = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(result as ApiResponse<EnrollmentDocument[]>);
            } else {
              reject({
                code: result.code || 'ERROR',
                message: result.error || 'Erro ao enviar documento',
              });
            }
          } catch {
            reject({
              code: 'PARSE_ERROR',
              message: 'Erro ao processar resposta do servidor',
            });
          }
        });

        xhr.addEventListener('error', () => {
          reject({
            code: 'NETWORK_ERROR',
            message: 'Erro de conexão ao enviar documento',
          });
        });

        xhr.addEventListener('abort', () => {
          reject({
            code: 'ABORTED',
            message: 'Upload cancelado',
          });
        });

        xhr.open('POST', `${API_URL}/public/enrollment/${token}/documents`);
        xhr.send(formData);
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollmentData', variables.token] });
      toast.success('Documento enviado!');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao enviar documento');
    },
  });
}

/**
 * Toggle includesOtherDocs on an enrollment document (e.g., CPF included in RG)
 */
export function useToggleDocumentIncludes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      documentId,
      includesOtherDocs,
    }: {
      token: string;
      documentId: string;
      includesOtherDocs: string[];
    }) => {
      const response = await fetch(
        `${API_URL}/public/enrollment/${token}/documents/${documentId}/includes`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ includesOtherDocs }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw {
          code: result.code || 'ERROR',
          message: result.error || 'Erro ao atualizar documento',
        };
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollmentData', variables.token] });
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao atualizar documento');
    },
  });
}

/**
 * Delete enrollment document
 */
export function useDeleteEnrollmentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      documentId,
    }: {
      token: string;
      documentId: string;
    }) => {
      const response = await fetch(`${API_URL}/public/enrollment/${token}/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw {
          code: result.code || 'ERROR',
          message: result.error || 'Erro ao remover documento',
        };
      }

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollmentData', variables.token] });
      toast.success('Documento removido!');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao remover documento');
    },
  });
}
