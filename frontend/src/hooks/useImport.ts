import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ImportPreviewResult, ImportResult, ImportHistory, ParsedRow, FamilyGroup, DocumentUploadResult } from '@/types/import';

export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File): Promise<ImportPreviewResult> => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return data.data;
    },
  });
}

export function useImportConfirm() {
  return useMutation({
    mutationFn: async (body: {
      rows: ParsedRow[];
      duplicateActions: Record<number, string>;
      familyGroups: FamilyGroup[];
      fileName: string;
      fileSize: number | null;
    }): Promise<{ importHistoryId: string; status: string; totalRows: number }> => {
      const { data } = await api.post('/import/confirm', body, {
        timeout: 30000, // Returns immediately now — just creates the job
      });
      return data.data;
    },
  });
}

/**
 * Polls import history until status is no longer PROCESSING.
 * enabled: only when we have an importHistoryId and it's still processing.
 */
export function useImportProgress(importHistoryId: string | null) {
  return useQuery({
    queryKey: ['import-progress', importHistoryId],
    queryFn: async () => {
      const { data } = await api.get(`/import/history/${importHistoryId}`);
      return data.data as ImportHistory;
    },
    enabled: !!importHistoryId,
    refetchInterval: importHistoryId ? 3000 : false,
    refetchIntervalInBackground: true,
  });
}

export function useImportTemplate() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.get('/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template-importacao-school-lab.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useImportHistory(page: number = 1, limit: number = 25) {
  return useQuery({
    queryKey: ['import-history', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/import/history', { params: { page, limit } });
      return data as {
        data: ImportHistory[];
        meta: { page: number; totalPages: number; total: number };
      };
    },
  });
}

export function useImportHistoryById(id: string) {
  return useQuery({
    queryKey: ['import-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/import/history/${id}`);
      return data.data as ImportHistory;
    },
    enabled: !!id,
  });
}

export function useImportDocuments() {
  return useMutation({
    mutationFn: async (params: {
      file: File;
      studentIds: string[];
    }): Promise<DocumentUploadResult> => {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('studentIds', JSON.stringify(params.studentIds));
      const { data } = await api.post('/import/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return data.data;
    },
  });
}
