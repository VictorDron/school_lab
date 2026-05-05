import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, FileText, Download, Eye, Trash2, Lock, Globe, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { get, api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingScreen';

interface Document {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  module?: string;
  securityLevel: string;
  tags: string[];
  createdAt: string;
  uploadedBy: { id: string; displayName: string; avatarUrl?: string };
}

const securityColors: Record<string, string> = {
  PUBLIC: 'text-success-600',
  INTERNAL: 'text-primary-600',
  SENSITIVE: 'text-warning-600',
  RESTRICTED: 'text-orange-600',
  CONFIDENTIAL: 'text-error-600',
};

const securityLabels: Record<string, string> = {
  PUBLIC: 'Público',
  INTERNAL: 'Interno',
  SENSITIVE: 'Sensível',
  RESTRICTED: 'Restrito',
  CONFIDENTIAL: 'Confidencial',
};

const securityIcons: Record<string, typeof Globe> = {
  PUBLIC: Globe,
  INTERNAL: FileText,
  SENSITIVE: Shield,
  RESTRICTED: Lock,
  CONFIDENTIAL: Lock,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GEDPage() {
  const { hasModuleAccess } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [securityFilter, setSecurityFilter] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const canEdit = hasModuleAccess('GED', 'EDIT');

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['documents', { search: searchQuery, securityLevel: securityFilter }],
    queryFn: () => get<Document[]>('/documents', {
      params: { search: searchQuery || undefined, securityLevel: securityFilter || undefined },
    }),
  });

  const docs = docsData?.data || [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Documento enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true);
      uploadMutation.mutate(acceptedFiles[0]);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: !canEdit,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 lg:p-6 bg-white border-b border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Upload Zone */}
          {canEdit && (
            <div
              {...getRootProps()}
              className={`flex-1 max-w-md border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragActive ? 'text-primary-500' : 'text-neutral-400'}`} />
              <p className="text-sm text-neutral-600">
                {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste ou clique para enviar'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">PDF, DOC, XLS, Imagens • Máx. 10MB</p>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm w-full sm:w-64"
              />
            </div>
            <select
              value={securityFilter}
              onChange={(e) => setSecurityFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="">Todos os níveis</option>
              {Object.entries(securityLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isUploading && (
        <div className="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center gap-3">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-primary-700">Enviando documento...</span>
        </div>
      )}

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum documento</p>
            <p className="text-neutral-500">Faça upload de documentos para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc, index) => {
              const SecurityIcon = securityIcons[doc.securityLevel] || FileText;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card p-4 hover:shadow-medium transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-medium text-neutral-900 truncate">{doc.title}</h4>
                        <SecurityIcon className={`w-4 h-4 ${securityColors[doc.securityLevel]}`} />
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.uploadedBy.displayName}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {doc.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                      <a
                        href={doc.fileUrl}
                        download
                        className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
