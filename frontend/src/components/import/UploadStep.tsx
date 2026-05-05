import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Download, X } from 'lucide-react';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  onDownloadTemplate: () => void;
  isDownloadingTemplate: boolean;
}

export function UploadStep({ onFileSelected, onDownloadTemplate, isDownloadingTemplate }: UploadStepProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleContinue = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-violet-400 bg-violet-50'
            : 'border-neutral-300 bg-neutral-50 hover:border-violet-300 hover:bg-violet-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
        <p className="text-sm font-medium text-neutral-700">
          Arraste o arquivo CSV ou XLSX aqui
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          ou clique para selecionar
        </p>
        <p className="text-xs text-neutral-400 mt-3">
          Formatos aceitos: .csv, .xlsx
        </p>
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-lg">
          <FileSpreadsheet className="w-8 h-8 text-violet-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-neutral-500">
              {formatFileSize(selectedFile.size)}
            </p>
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

      {/* Continue button */}
      {selectedFile && (
        <button
          onClick={handleContinue}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Continuar
        </button>
      )}

      {/* Template download */}
      <div className="text-center pt-2">
        <button
          onClick={onDownloadTemplate}
          disabled={isDownloadingTemplate}
          className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isDownloadingTemplate ? 'Baixando...' : 'Baixar template de importação'}
        </button>
      </div>
    </div>
  );
}
