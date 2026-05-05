import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileArchive, CheckCircle, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { useImportDocuments } from '@/hooks/useImport';
import type { DocumentUploadResult } from '@/types/import';

const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentUploadStepProps {
  createdStudentIds: string[];
  onFinish: () => void;
}

export function DocumentUploadStep({ createdStudentIds, onFinish }: DocumentUploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<DocumentUploadResult | null>(null);
  const documentsMutation = useImportDocuments();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
    maxSize: MAX_ZIP_SIZE,
    multiple: false,
  });

  const handleSubmit = useCallback(async () => {
    if (!selectedFile) return;
    try {
      const result = await documentsMutation.mutateAsync({
        file: selectedFile,
        studentIds: createdStudentIds,
      });
      setUploadResult(result);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [selectedFile, createdStudentIds, documentsMutation]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
  }, []);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header + Skip */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <FileArchive className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Upload de Documentos</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Envie um arquivo ZIP com pastas nomeadas pelo nome do aluno. O sistema associar&aacute; os documentos automaticamente.
            </p>
          </div>
        </div>
        <button
          onClick={onFinish}
          className="text-sm text-neutral-500 hover:text-neutral-700 font-medium transition-colors whitespace-nowrap ml-4"
        >
          Pular esta etapa
        </button>
      </div>

      {/* Dropzone */}
      {!uploadResult && (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-violet-400 bg-violet-50'
                : 'border-neutral-300 bg-neutral-50 hover:border-violet-300 hover:bg-violet-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <FileArchive className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-700">
              Arraste o arquivo ZIP aqui
            </p>
            <p className="text-xs text-neutral-500 mt-1">ou clique para selecionar</p>
            <p className="text-xs text-neutral-400 mt-3">
              Formato aceito: .zip (m&aacute;ximo 50 MB)
            </p>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <FileArchive className="w-8 h-8 text-violet-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="p-1 hover:bg-violet-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          )}

          {/* Submit button */}
          {selectedFile && (
            <button
              onClick={handleSubmit}
              disabled={documentsMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {documentsMutation.isPending ? 'Processando documentos...' : 'Enviar'}
            </button>
          )}

          {/* Loading overlay */}
          {documentsMutation.isPending && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-600" />
              <p className="text-sm text-neutral-600">Processando documentos...</p>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {uploadResult && (
        <div className="space-y-4">
          {/* Upload stats */}
          <div className="bg-neutral-50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-neutral-700">
              {uploadResult.uploadResult.uploaded} documentos enviados, {uploadResult.uploadResult.failed} falhas
            </p>
          </div>

          {/* Matched documents */}
          {uploadResult.matched.length > 0 && (
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Documentos associados ({uploadResult.matched.length})
                </h3>
              </div>
              <ul className="divide-y divide-green-100">
                {uploadResult.matched.map((match, i) => (
                  <li key={i} className="px-4 py-2 text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {match.folderName} &mdash; {match.fileName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unmatched documents */}
          {uploadResult.unmatched.length > 0 && (
            <div className="border border-yellow-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                <h3 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Documentos n&atilde;o associados ({uploadResult.unmatched.length})
                </h3>
              </div>
              <ul className="divide-y divide-yellow-100">
                {uploadResult.unmatched.map((item, i) => (
                  <li key={i} className="px-4 py-2 text-sm text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {item.folderName} &mdash; {item.fileName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upload errors */}
          {uploadResult.uploadResult.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                <h3 className="text-sm font-medium text-red-800">
                  Erros no envio ({uploadResult.uploadResult.errors.length})
                </h3>
              </div>
              <ul className="divide-y divide-red-100">
                {uploadResult.uploadResult.errors.map((err, i) => (
                  <li key={i} className="px-4 py-2 text-sm text-red-700">
                    {err.fileName}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Finish button */}
          <button
            onClick={onFinish}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}
