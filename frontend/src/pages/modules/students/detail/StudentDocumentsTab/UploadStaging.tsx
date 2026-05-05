import { FileText, Upload, X } from 'lucide-react';
import { DOCUMENT_TYPE_OPTIONS } from './constants';
import { formatFileSize } from './helpers';
import type { PendingFile } from './types';

interface UploadStagingProps {
  files: PendingFile[];
  onRemove: (index: number) => void;
  onChangeType: (index: number, type: string) => void;
  onSubmit: () => void;
  isUploading: boolean;
}

export function UploadStaging({
  files,
  onRemove,
  onChangeType,
  onSubmit,
  isUploading,
}: UploadStagingProps) {
  return (
    <div className="border border-violet-200 bg-violet-50/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">
          {files.length} arquivo(s) selecionado(s)
        </p>
      </div>

      <div className="space-y-2">
        {files.map((pf, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 bg-white rounded-lg border border-neutral-200 p-3"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded bg-neutral-100 flex items-center justify-center overflow-hidden">
              {pf.preview ? (
                <img src={pf.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-800 truncate">{pf.file.name}</p>
              <p className="text-xs text-neutral-400">{formatFileSize(pf.file.size)}</p>
            </div>
            <select
              value={pf.documentType}
              onChange={(e) => onChangeType(idx, e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 max-w-[180px]"
            >
              {DOCUMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => onRemove(idx)}
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Enviando...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" /> Enviar Documento(s)
          </>
        )}
      </button>
    </div>
  );
}
