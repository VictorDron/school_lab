import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { ImportStepper } from '@/components/import/ImportStepper';
import { UploadStep } from '@/components/import/UploadStep';
import { MappingStep } from '@/components/import/MappingStep';
import { PreviewStep } from '@/components/import/PreviewStep';
import { ConfirmStep } from '@/components/import/ConfirmStep';
import { ResultStep } from '@/components/import/ResultStep';
import { DocumentUploadStep } from '@/components/import/DocumentUploadStep';
import { useImportPreview, useImportConfirm, useImportTemplate, useImportProgress } from '@/hooks/useImport';
import type {
  ImportStep,
  ImportPreviewResult,
  ImportResult,
  DuplicateAction,
} from '@/types/import';

export default function ImportPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [duplicateActions, setDuplicateActions] = useState<Record<number, DuplicateAction>>({});
  const [importHistoryId, setImportHistoryId] = useState<string | null>(null);

  const previewMutation = useImportPreview();
  const confirmMutation = useImportConfirm();
  const templateMutation = useImportTemplate();

  // Poll for import progress when we have an importHistoryId
  const progressQuery = useImportProgress(
    currentStep === 'confirm' ? importHistoryId : null
  );

  // When polling detects completion, transition to result step
  useEffect(() => {
    if (progressQuery.data && progressQuery.data.status !== 'PROCESSING') {
      const h = progressQuery.data;
      setImportResult({
        importHistoryId: h.id,
        created: h.created,
        updated: h.updated,
        failed: h.failed,
        skipped: h.skipped,
        errors: h.errors || [],
        createdStudentIds: h.createdStudentIds || [],
      });
      setImportHistoryId(null);
      setCurrentStep('result');
    }
  }, [progressQuery.data]);

  const handleFileSelected = useCallback(
    async (file: File) => {
      setUploadedFile(file);
      try {
        const result = await previewMutation.mutateAsync(file);
        setPreviewData(result);
        setCurrentStep('mapping');
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [previewMutation]
  );

  const handleDownloadTemplate = useCallback(() => {
    templateMutation.mutate(undefined, {
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }, [templateMutation]);

  const handleDuplicateActionChange = useCallback(
    (rowNumber: number, action: DuplicateAction) => {
      setDuplicateActions((prev) => ({ ...prev, [rowNumber]: action }));
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!previewData || !uploadedFile) return;

    try {
      const result = await confirmMutation.mutateAsync({
        rows: previewData.rows,
        duplicateActions,
        familyGroups: previewData.familyGroups,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
      });
      // Backend returns immediately with importHistoryId — start polling
      setImportHistoryId(result.importHistoryId);
      toast.success('Importação iniciada! Processando em segundo plano...');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [previewData, uploadedFile, duplicateActions, confirmMutation]);

  const handleNewImport = useCallback(() => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setDuplicateActions({});
    setImportHistoryId(null);
  }, []);

  // Calculate progress percentage from polling data
  const processingProgress = progressQuery.data
    ? Math.round(((progressQuery.data.created + progressQuery.data.failed + progressQuery.data.skipped) / Math.max(progressQuery.data.totalRows, 1)) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">Importação em Massa</h1>
        </div>
        <ImportStepper currentStep={currentStep} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {currentStep === 'upload' && (
          <UploadStep
            onFileSelected={handleFileSelected}
            onDownloadTemplate={handleDownloadTemplate}
            isDownloadingTemplate={templateMutation.isPending}
          />
        )}

        {currentStep === 'mapping' && previewData && (
          <MappingStep
            previewData={previewData}
            onContinue={() => setCurrentStep('preview')}
            onBack={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'preview' && previewData && (
          <PreviewStep
            previewData={previewData}
            duplicateActions={duplicateActions}
            onDuplicateActionChange={handleDuplicateActionChange}
            onContinue={() => setCurrentStep('confirm')}
            onBack={() => setCurrentStep('mapping')}
          />
        )}

        {currentStep === 'confirm' && previewData && !importHistoryId && (
          <ConfirmStep
            previewData={previewData}
            duplicateActions={duplicateActions}
            onConfirm={handleConfirm}
            onBack={() => setCurrentStep('preview')}
            isLoading={confirmMutation.isPending}
          />
        )}

        {/* Processing state — polling for progress */}
        {currentStep === 'confirm' && importHistoryId && (
          <div className="max-w-lg mx-auto mt-12">
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center space-y-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Importando alunos...</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  O processamento está em andamento. Não feche esta página.
                </p>
              </div>
              {progressQuery.data && (
                <div className="space-y-3">
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div
                      className="bg-violet-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(processingProgress, 2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>
                      {progressQuery.data.created + progressQuery.data.failed + progressQuery.data.skipped} de {progressQuery.data.totalRows} processados
                    </span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="flex gap-4 text-xs text-neutral-500 justify-center">
                    <span className="text-green-600">{progressQuery.data.created} criados</span>
                    {progressQuery.data.failed > 0 && (
                      <span className="text-red-600">{progressQuery.data.failed} falhas</span>
                    )}
                    {progressQuery.data.skipped > 0 && (
                      <span className="text-yellow-600">{progressQuery.data.skipped} ignorados</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 'result' && importResult && (
          <div className="space-y-6">
            <ResultStep
              result={importResult}
              onViewHistory={() => navigate('/students/import/history')}
              onNewImport={handleNewImport}
            />
            {importResult.created > 0 && (
              <div className="max-w-lg mx-auto bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-violet-800">
                  Deseja enviar documentos dos alunos?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('documents')}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Sim, enviar ZIP
                  </button>
                  <button
                    onClick={() => navigate('/students/import/history')}
                    className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Pular
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'documents' && importResult && (
          <DocumentUploadStep
            createdStudentIds={importResult.createdStudentIds}
            onFinish={() => navigate('/students/import/history')}
          />
        )}

        {/* Loading overlay for preview */}
        {currentStep === 'upload' && previewMutation.isPending && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
              <p className="text-sm font-medium text-neutral-700">Processando arquivo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
