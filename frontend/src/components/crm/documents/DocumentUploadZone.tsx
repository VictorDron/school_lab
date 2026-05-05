import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, User, Info, Image as ImageIcon } from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import { documentCategories } from './constants';
import { formatFileSize, isImageFile, getDocumentTypeInfo } from './utils';

interface DocumentUploadZoneProps {
  uploadingFiles: File[];
  setUploadingFiles: (files: File[]) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  children: LeadChild[];
  onUpload: () => void;
  isUploading: boolean;
  canEdit: boolean;
}

export function DocumentUploadZone({
  uploadingFiles,
  setUploadingFiles,
  selectedType,
  setSelectedType,
  selectedChildId,
  setSelectedChildId,
  children,
  onUpload,
  isUploading,
  canEdit,
}: DocumentUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadingFiles(acceptedFiles);
    },
    [setUploadingFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    disabled: !canEdit,
  });

  const typeInfo = getDocumentTypeInfo(selectedType);
  const showChildSelector = typeInfo?.perChild && children.length > 0;

  if (!canEdit) return null;

  if (uploadingFiles.length === 0) {
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-xl flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary-600" />
        </div>
        <p className="text-sm font-medium text-neutral-900">
          {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste arquivos ou clique para selecionar'}
        </p>
        <p className="text-xs text-neutral-500 mt-1">PDF, DOC, DOCX, PNG, JPG (max 10MB)</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-neutral-900">{uploadingFiles.length} arquivo(s) selecionado(s)</h4>
        <button
          onClick={() => {
            setUploadingFiles([]);
            setSelectedType('OTHER');
            setSelectedChildId('');
          }}
          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {uploadingFiles.map((file, index) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-lg">
            {isImageFile(file.name) ? (
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-purple-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate">{file.name}</p>
              <p className="text-xs text-neutral-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de Documento</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="input w-full">
            {Object.entries(documentCategories).map(([key, category]) => (
              <optgroup key={key} label={category.label}>
                {category.types.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {showChildSelector && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              <User className="w-3 h-3 inline mr-1" />
              Aluno (opcional)
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="input w-full"
            >
              <option value="">Não especificar</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.fullName}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              <Info className="w-3 h-3 inline mr-1" />O nome do aluno será adicionado ao nome do arquivo
            </p>
          </div>
        )}

        <button onClick={onUpload} disabled={isUploading} className="btn btn-primary w-full">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Enviar Documento(s)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
