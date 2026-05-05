import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  ArrowLeft,
  FileArchive,
  Upload,
  CheckCircle,
  AlertTriangle,
  X,
  Filter,
  History,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import {
  useUploadStudentDocuments,
  type StudentDocumentUploadResult,
} from '@/hooks/useStudents';
import { useImportHistory } from '@/hooks/useImport';

type SelectionMode = 'filters' | 'import' | null;

const MAX_ZIP_SIZE = 50 * 1024 * 1024;

const GRADE_OPTIONS = [
  'Nursery', 'Pre-K3', 'Pre-K4', 'Kindergarten',
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade',
  '10th Grade', '11th Grade', '12th Grade',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const uploadMutation = useUploadStudentDocuments();

  // Selection mode
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);

  // Filter mode state
  const [filterGrade, setFilterGrade] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('ACTIVE');

  // Import history mode state
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const importHistoryQuery = useImportHistory(1, 10);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<StudentDocumentUploadResult | null>(null);

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

  const canSubmit = selectedFile && (selectionMode === 'filters' || (selectionMode === 'import' && selectedImportId));

  const handleSubmit = useCallback(async () => {
    if (!selectedFile || !selectionMode) return;

    try {
      let result: StudentDocumentUploadResult;

      if (selectionMode === 'filters') {
        result = await uploadMutation.mutateAsync({
          file: selectedFile,
          filters: {
            academicYear: filterYear,
            grade: filterGrade || undefined,
            status: filterStatus || undefined,
          },
        });
      } else {
        result = await uploadMutation.mutateAsync({
          file: selectedFile,
          importHistoryId: selectedImportId!,
        });
      }

      setUploadResult(result);
      toast.success(`${result.uploadResult.uploaded} documento(s) enviado(s) com sucesso!`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [selectedFile, selectionMode, filterYear, filterGrade, filterStatus, selectedImportId, uploadMutation]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setUploadResult(null);
    setSelectionMode(null);
    setSelectedImportId(null);
  }, []);

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-violet-600" />
            <h1 className="text-lg font-semibold text-neutral-900">
              Upload de Documentos
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Intro */}
          {!uploadResult && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <p className="text-sm text-neutral-600">
                Envie um arquivo ZIP com pastas nomeadas pelo nome de cada aluno.
                O sistema faz o casamento automaticamente por similaridade de nome.
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                Estrutura esperada: <code className="bg-neutral-100 px-1.5 py-0.5 rounded">alunos.zip / Nome do Aluno / documento.pdf</code>
              </p>
            </div>
          )}

          {/* Step 1: Selection Mode */}
          {!uploadResult && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-700">
                1. Selecione os alunos para associar
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => { setSelectionMode('filters'); setSelectedImportId(null); }}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selectionMode === 'filters'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300',
                  )}
                >
                  <Filter className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', selectionMode === 'filters' ? 'text-violet-600' : 'text-neutral-400')} />
                  <div>
                    <p className={clsx('text-sm font-medium', selectionMode === 'filters' ? 'text-violet-800' : 'text-neutral-700')}>
                      Por filtro
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Ano letivo, turma e status
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectionMode('import')}
                  className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                    selectionMode === 'import'
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300',
                  )}
                >
                  <History className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', selectionMode === 'import' ? 'text-violet-600' : 'text-neutral-400')} />
                  <div>
                    <p className={clsx('text-sm font-medium', selectionMode === 'import' ? 'text-violet-800' : 'text-neutral-700')}>
                      Por importação anterior
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Alunos de uma importação específica
                    </p>
                  </div>
                </button>
              </div>

              {/* Filter fields */}
              {selectionMode === 'filters' && (
                <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Ano Letivo
                      </label>
                      <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      >
                        {[2024, 2025, 2026, 2027].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Turma
                      </label>
                      <select
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="">Todas</option>
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Status
                      </label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                        <option value="TRANSFERRED">Transferido</option>
                        <option value="GRADUATED">Graduado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Import history selection */}
              {selectionMode === 'import' && (
                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  {importHistoryQuery.isLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                    </div>
                  )}
                  {importHistoryQuery.data && (
                    <div className="divide-y divide-neutral-100">
                      {importHistoryQuery.data.data.length === 0 && (
                        <p className="text-sm text-neutral-500 text-center py-6">
                          Nenhuma importação encontrada.
                        </p>
                      )}
                      {importHistoryQuery.data.data
                        .filter((h) => h.status === 'COMPLETED' && h.created > 0)
                        .map((h) => (
                          <button
                            key={h.id}
                            onClick={() => setSelectedImportId(h.id)}
                            className={clsx(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                              selectedImportId === h.id
                                ? 'bg-violet-50'
                                : 'hover:bg-neutral-50',
                            )}
                          >
                            <div className={clsx(
                              'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                              selectedImportId === h.id
                                ? 'border-violet-600 bg-violet-600'
                                : 'border-neutral-300',
                            )}>
                              {selectedImportId === h.id && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-800 truncate">
                                {h.fileName}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatDate(h.createdAt)} - {h.created} aluno(s) criado(s)
                              </p>
                            </div>
                            <Users className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: File Upload */}
          {!uploadResult && selectionMode && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-neutral-700">
                2. Envie o arquivo ZIP
              </h2>

              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-neutral-300 bg-white hover:border-violet-300 hover:bg-violet-50/50',
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-700">
                  Arraste o arquivo ZIP aqui
                </p>
                <p className="text-xs text-neutral-500 mt-1">ou clique para selecionar</p>
                <p className="text-xs text-neutral-400 mt-3">
                  Formato aceito: .zip (máximo 50 MB)
                </p>
              </div>

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
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadResult(null); }}
                    className="p-1 hover:bg-violet-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>
              )}

              {/* Submit button */}
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={uploadMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Processando documentos...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Enviar e associar documentos
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {uploadResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center space-y-2">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                <h2 className="text-lg font-semibold text-neutral-900">Upload concluído</h2>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <span className="text-neutral-600">
                    <strong>{uploadResult.totalStudents}</strong> alunos na base
                  </span>
                  <span className="text-green-600">
                    <strong>{uploadResult.uploadResult.uploaded}</strong> enviados
                  </span>
                  {uploadResult.uploadResult.skipped > 0 && (
                    <span className="text-yellow-600">
                      <strong>{uploadResult.uploadResult.skipped}</strong> já existentes
                    </span>
                  )}
                  {uploadResult.uploadResult.failed > 0 && (
                    <span className="text-red-600">
                      <strong>{uploadResult.uploadResult.failed}</strong> falhas
                    </span>
                  )}
                </div>
              </div>

              {/* Matched */}
              {uploadResult.matched.length > 0 && (
                <div className="border border-green-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-green-50 border-b border-green-200">
                    <h3 className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Documentos associados ({uploadResult.matched.length})
                    </h3>
                  </div>
                  <ul className="divide-y divide-green-100 max-h-60 overflow-y-auto">
                    {uploadResult.matched.map((m, i) => (
                      <li key={i} className="px-4 py-2 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {m.folderName ? `${m.folderName} / ` : ''}{m.fileName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unmatched */}
              {uploadResult.unmatched.length > 0 && (
                <div className="border border-yellow-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                    <h3 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Documentos não associados ({uploadResult.unmatched.length})
                    </h3>
                  </div>
                  <ul className="divide-y divide-yellow-100 max-h-60 overflow-y-auto">
                    {uploadResult.unmatched.map((u, i) => (
                      <li key={i} className="px-4 py-2 text-sm text-yellow-700 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {u.folderName ? `${u.folderName} / ` : ''}{u.fileName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {uploadResult.uploadResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
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

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-3 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  Novo upload
                </button>
                <button
                  onClick={() => navigate('/students')}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Voltar para alunos
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
