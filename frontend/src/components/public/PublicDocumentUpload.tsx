import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Document types for families to upload
const PUBLIC_DOCUMENT_TYPES = [
  { value: 'BIRTH_CERTIFICATE', label: { pt: 'Certidão de Nascimento', en: 'Birth Certificate' }, perChild: true },
  { value: 'ID_DOCUMENT', label: { pt: 'RG/CPF dos Responsáveis', en: 'Parent ID' }, perChild: false },
  { value: 'PROOF_OF_ADDRESS', label: { pt: 'Comprovante de Residência', en: 'Proof of Address' }, perChild: false },
  { value: 'SCHOOL_RECORDS', label: { pt: 'Histórico Escolar', en: 'School Records' }, perChild: true },
  { value: 'VACCINATION_CARD', label: { pt: 'Carteira de Vacinação', en: 'Vaccination Card' }, perChild: true },
  { value: 'PHOTO_3X4', label: { pt: 'Foto 3x4', en: '3x4 Photo' }, perChild: true },
  { value: 'OTHER', label: { pt: 'Outro', en: 'Other' }, perChild: false },
];

interface ChildOption {
  id: string;
  name: string;
}

interface Props {
  token: string;
  language: 'pt' | 'en';
  children?: ChildOption[];
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export function PublicDocumentUpload({ token, language, children = [] }: Props) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('OTHER');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);

  // Fetch existing documents
  const { data: documentsData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ['public-documents', token],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/public/application/${token}/documents`);
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch documents');
      }
      return json.data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload: File[]) => {
      const formData = new FormData();
      filesToUpload.forEach(file => {
        formData.append('files', file);
      });
      formData.append('documentType', selectedType);
      if (selectedChildId) {
        formData.append('childId', selectedChildId);
      }

      const response = await fetch(`${API_URL}/public/application/${token}/documents`, {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to upload documents');
      }
      return json;
    },
    onSuccess: () => {
      toast.success(language === 'pt' ? 'Documentos enviados com sucesso!' : 'Documents uploaded successfully!');
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ['public-documents', token] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    uploadMutation.mutate(files);
  };

  const selectedTypeConfig = PUBLIC_DOCUMENT_TYPES.find(t => t.value === selectedType);
  const existingDocuments = documentsData?.documents || [];

  return (
    <div className="space-y-6">
      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            {language === 'pt' ? 'Envio de Documentos (Opcional)' : 'Document Upload (Optional)'}
          </p>
          <p className="text-sm text-blue-700">
            {language === 'pt'
              ? 'Voce pode enviar documentos agora ou depois. Arquivos aceitos: PDF, imagens, Word. Maximo 10MB por arquivo.'
              : 'You can upload documents now or later. Accepted files: PDF, images, Word. Maximum 10MB per file.'}
          </p>
        </div>
      </div>

      {/* Existing documents */}
      {existingDocuments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-700 mb-2">
            {language === 'pt' ? 'Documentos ja enviados' : 'Already uploaded documents'}
          </h4>
          <div className="space-y-2">
            {existingDocuments.map((doc: UploadedDocument) => (
              <div key={doc.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{doc.name}</p>
                  <p className="text-xs text-neutral-500">
                    {PUBLIC_DOCUMENT_TYPES.find(t => t.value === doc.type)?.label[language] || doc.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document type selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">
            {language === 'pt' ? 'Tipo de Documento' : 'Document Type'}
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            {PUBLIC_DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label[language]}
              </option>
            ))}
          </select>
        </div>

        {/* Child selector for per-child documents */}
        {selectedTypeConfig?.perChild && children.length > 0 && (
          <div>
            <label className="label">
              {language === 'pt' ? 'De qual crianca?' : 'For which child?'}
            </label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="input"
            >
              <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? 'text-primary-600' : 'text-neutral-400'}`} />
        <p className="text-sm text-neutral-600">
          {isDragActive
            ? (language === 'pt' ? 'Solte os arquivos aqui...' : 'Drop files here...')
            : (language === 'pt' ? 'Arraste arquivos ou clique para selecionar' : 'Drag files or click to select')}
        </p>
      </div>

      {/* Selected files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-neutral-700">
              {language === 'pt' ? 'Arquivos selecionados' : 'Selected files'} ({files.length})
            </h4>
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-3 bg-neutral-50 rounded-lg p-3">
                <FileText className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                  <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="btn btn-primary btn-sm w-full"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'pt' ? 'Enviando...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {language === 'pt' ? 'Enviar Documentos' : 'Upload Documents'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
