import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { useUploadStudentDocument } from '@/hooks/useStudents';
import type { PendingFile } from './types';

interface UseDocumentUploadParams {
  studentId: string;
}

/**
 * Owns the upload staging area: stages dropped files in memory with
 * object-URL previews for images, exposes per-row remove/change-type
 * handlers, and on submit serializes the upload mutation through every
 * staged file before clearing the list and revoking the previews.
 * useDropzone disables clicks/drag while files are staged so the user
 * has to either submit or remove the queue first.
 */
export function useDocumentUpload({ studentId }: UseDocumentUploadParams) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const uploadMutation = useUploadStudentDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPending: PendingFile[] = acceptedFiles.map((file) => ({
      file,
      documentType: 'OTHER',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
  }, []);

  const handleRemovePending = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleChangePendingType = useCallback((index: number, type: string) => {
    setPendingFiles((prev) =>
      prev.map((pf, i) => (i === index ? { ...pf, documentType: type } : pf)),
    );
  }, []);

  const handleSubmitPending = useCallback(async () => {
    for (const pf of pendingFiles) {
      try {
        await uploadMutation.mutateAsync({
          studentId,
          file: pf.file,
          documentType: pf.documentType,
        });
      } catch (error) {
        toast.error(`${pf.file.name}: ${getErrorMessage(error)}`);
      }
    }
    pendingFiles.forEach((pf) => {
      if (pf.preview) URL.revokeObjectURL(pf.preview);
    });
    setPendingFiles([]);
    toast.success('Documentos enviados!');
  }, [pendingFiles, studentId, uploadMutation]);

  const dropzone = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
    noClick: pendingFiles.length > 0,
    noDrag: pendingFiles.length > 0,
  });

  return {
    pendingFiles,
    handleRemovePending,
    handleChangePendingType,
    handleSubmitPending,
    isUploading: uploadMutation.isPending,
    dropzone,
  };
}
