import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, patch, getErrorMessage } from '@/lib/api';
import { joinStudentsList, leaveStudentsList, onStudentListUpdated } from '@/lib/socket';
import toast from 'react-hot-toast';
import type {
  Student,
  StudentDetail,
  StudentFilters,
  StudentStatus,
  UpdateStudentData,
  StudentDashboardStats,
  StudentEvolutionStats,
} from '@/types/students';
import { api } from '@/lib/api';

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () =>
      get<Student[]>('/students', {
        params: {
          search: filters.search || undefined,
          grade: filters.grade || undefined,
          academicYear: filters.academicYear || undefined,
          status: filters.status || undefined,
          page: filters.page || 1,
          limit: filters.limit || 25,
          parentName: filters.parentName || undefined,
          enrolledAfter: filters.enrolledAfter || undefined,
          enrolledBefore: filters.enrolledBefore || undefined,
          ageMin: filters.ageMin ?? undefined,
          ageMax: filters.ageMax ?? undefined,
          sortBy: filters.sortBy || undefined,
          sortOrder: filters.sortOrder || undefined,
        },
      }),
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => get<StudentDetail>(`/students/${id}`),
    enabled: !!id,
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: StudentStatus;
      reason?: string;
    }) => patch(`/students/${id}/status`, { status, reason }),
    onSuccess: (_, variables) => {
      toast.success('Status do aluno atualizado!');
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateStudentData> }) =>
      patch(`/students/${id}`, data),
    onSuccess: (_, variables) => {
      toast.success('Dados do aluno atualizados!');
      queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useStudentDashboard(filters?: { academicYear?: number }) {
  return useQuery({
    queryKey: ['studentDashboard', filters],
    queryFn: () =>
      get<StudentDashboardStats>('/students/stats/dashboard', { params: filters }),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useBulkUpdateStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: { type: 'changeGrade' | 'changeStatus'; value: string };
    }) => patch('/students/bulk', { ids, action }),
    onSuccess: (_, variables) => {
      const label = variables.action.type === 'changeGrade' ? 'Turma' : 'Status';
      toast.success(`${label} atualizado(a) para ${variables.ids.length} aluno(s)!`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useExportSelectedStudentsCsv() {
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await api.get('/students/export', {
        params: { ids: ids.join(',') },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alunos-selecionados_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('CSV exportado com sucesso!'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useExportStudentsCsv() {
  return useMutation({
    mutationFn: async (filters: StudentFilters) => {
      const response = await api.get('/students/export', {
        params: {
          search: filters.search || undefined,
          grade: filters.grade || undefined,
          academicYear: filters.academicYear || undefined,
          status: filters.status || undefined,
          parentName: filters.parentName || undefined,
          enrolledAfter: filters.enrolledAfter || undefined,
          enrolledBefore: filters.enrolledBefore || undefined,
          ageMin: filters.ageMin ?? undefined,
          ageMax: filters.ageMax ?? undefined,
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alunos_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success('CSV exportado com sucesso!'),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useStudentEvolution(filters?: { academicYear?: number }) {
  return useQuery({
    queryKey: ['studentEvolution', filters],
    queryFn: () =>
      get<StudentEvolutionStats>('/students/stats/evolution', { params: filters }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Connects the student list view to Socket.io for real-time updates.
 * Joins the students:list room and listens for list invalidation events.
 * Call this in StudentsPage — not in individual query hooks.
 */
export function useStudentSocketSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    joinStudentsList();
    const cleanup = onStudentListUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    });
    return () => {
      leaveStudentsList();
      cleanup();
    };
  }, [queryClient]);
}

export interface DocumentUploadParams {
  file: File;
  studentIds?: string[];
  importHistoryId?: string;
  filters?: { academicYear?: number; grade?: string; status?: string };
}

export interface StudentDocumentUploadResult {
  totalStudents: number;
  matched: Array<{ folderName: string; fileName: string; matchedStudentId: string | null; matchScore: number }>;
  unmatched: Array<{ folderName: string; fileName: string }>;
  uploadResult: { uploaded: number; skipped: number; failed: number; errors: Array<{ fileName: string; error: string }> };
}

export function useUploadStudentDocuments() {
  return useMutation({
    mutationFn: async (params: DocumentUploadParams): Promise<StudentDocumentUploadResult> => {
      const formData = new FormData();
      formData.append('file', params.file);
      if (params.studentIds) formData.append('studentIds', JSON.stringify(params.studentIds));
      if (params.importHistoryId) formData.append('importHistoryId', params.importHistoryId);
      if (params.filters) formData.append('filters', JSON.stringify(params.filters));
      const { data } = await api.post('/students/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return data.data;
    },
  });
}

export function useUploadStudentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, file, documentType }: { studentId: string; file: File; documentType?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (documentType) formData.append('documentType', documentType);
      const { data } = await api.post(`/students/${studentId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
    },
  });
}

export function useReviewStudentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, docId, status, rejectionReason }: { studentId: string; docId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) => {
      const { data } = await api.patch(`/students/${studentId}/documents/${docId}/review`, { status, rejectionReason });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
    },
  });
}

export function useDeleteStudentDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, docId }: { studentId: string; docId: string }) => {
      const { data } = await api.delete(`/students/${studentId}/documents/${docId}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
    },
  });
}

export function useUpdateStudentDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, docId, documentType }: { studentId: string; docId: string; documentType: string }) => {
      const { data } = await api.patch(`/students/${studentId}/documents/${docId}/type`, { documentType });
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['student', variables.studentId] });
    },
  });
}

/**
 * Generic hook for inline field editing on student-related data.
 * endpoint: the sub-path after /students/:id (e.g. '' for student, '/health', '/health-plan', etc.)
 */
export function useUpdateStudentField(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: Record<string, unknown> }) => {
      const url = endpoint ? `/students/${studentId}${endpoint}` : `/students/${studentId}`;
      const res = await api.patch(url, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
    },
  });
}
