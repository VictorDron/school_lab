import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

export interface AdmissionDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
  childIndex?: number | null;
}

/**
 * Upload admission document with progress tracking
 * Note: Does NOT invalidate the application query to avoid resetting the form.
 * Document state is managed locally in the component via setUploadedDocuments.
 */
export function useUploadAdmissionDocument() {
  return useMutation({
    mutationFn: async ({
      token,
      file,
      documentType,
      childIndex,
      onProgress,
    }: {
      token: string;
      file: File;
      documentType: string;
      childIndex?: number;
      onProgress?: (progress: number) => void;
    }) => {
      return new Promise<{ success: boolean; data: AdmissionDocument[] }>((resolve, reject) => {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('documentType', documentType);
        if (childIndex != null) {
          formData.append('childIndex', String(childIndex));
        }

        const xhr = new XMLHttpRequest();

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
              resolve(result);
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

        xhr.open('POST', `${API_URL}/public/application/${token}/documents`);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      toast.success('Documento enviado!');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao enviar documento');
    },
  });
}

/**
 * Delete admission document
 * Note: Does NOT invalidate the application query to avoid resetting the form.
 * Document state is managed locally in the component via setUploadedDocuments.
 */
export function useDeleteAdmissionDocument() {
  return useMutation({
    mutationFn: async ({
      token,
      documentId,
    }: {
      token: string;
      documentId: string;
    }) => {
      const response = await fetch(`${API_URL}/public/application/${token}/documents/${documentId}`, {
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
    onSuccess: () => {
      toast.success('Documento removido!');
    },
    onError: (error: { code?: string; message: string }) => {
      toast.error(error.message || 'Erro ao remover documento');
    },
  });
}
