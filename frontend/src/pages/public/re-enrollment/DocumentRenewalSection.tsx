import { useRef, useState } from 'react';
import { Upload, CheckCircle, FileText, AlertCircle, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface RequiredDoc {
  documentType: string;
  label: string;
  required: boolean;
  existingFileName: string | null;
  expiryDate: string | null;
  isValid: boolean;
  isRejected?: boolean;
  status?: string | null;
  rejectionReason?: string | null;
  needsUpload: boolean;
}

interface Props {
  requiredDocuments: RequiredDoc[];
  token: string;
  childId?: string | null;
  onDocUploaded: () => void;
}

export default function DocumentRenewalSection({ requiredDocuments, token, childId, onDocUploaded }: Props) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docsNeedingUpload = requiredDocuments.filter((d) => d.needsUpload && !uploadedDocs.has(d.documentType));
  const hasRejected = requiredDocuments.some((d) => d.isRejected);
  const allValid = docsNeedingUpload.length === 0;

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('documentType', docType);
      formData.append('category', 'STUDENT');
      if (childId) formData.append('childId', childId);

      await api.post(`/public/re-enrollment/${token}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedDocs((prev) => new Set(prev).add(docType));
      toast.success('Documento enviado com sucesso!');
      onDocUploaded();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar documento.');
    } finally {
      setUploading(null);
    }
  };

  if (requiredDocuments.length === 0) return null;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-800 mb-1">Documentação</h2>
      <p className="text-xs text-neutral-500 mb-4">
        {allValid && !hasRejected
          ? 'Todos os documentos estão atualizados.'
          : hasRejected
            ? 'Alguns documentos foram reprovados pela secretaria. Por favor, reenvie os documentos indicados.'
            : 'Os documentos abaixo precisam ser atualizados para prosseguir com a rematrícula.'}
      </p>

      {/* Alert for rejected documents */}
      {hasRejected && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Atenção: documentos reprovados</p>
            <p className="text-xs text-red-600 mt-1">Reenvie os documentos marcados em vermelho abaixo para prosseguir com a rematrícula.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {requiredDocuments.map((doc) => {
          const isUploaded = uploadedDocs.has(doc.documentType);
          const isUploading = uploading === doc.documentType;
          const isRejected = doc.isRejected && !isUploaded;

          // Determine border/bg color
          let borderClass = 'border-amber-200 bg-amber-50/50';
          if (doc.isValid || isUploaded) {
            borderClass = 'border-emerald-200 bg-emerald-50/50';
          } else if (isRejected) {
            borderClass = 'border-red-300 bg-red-50/50';
          }

          return (
            <div
              key={doc.documentType}
              className={`flex items-center justify-between p-3 rounded-lg border ${borderClass}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {doc.isValid || isUploaded ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : isRejected ? (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isRejected ? 'text-red-800' : 'text-neutral-800'}`}>{doc.label}</p>
                  {doc.isValid && doc.existingFileName && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3 h-3" />
                      Válido — {doc.existingFileName}
                    </p>
                  )}
                  {isUploaded && (
                    <p className="text-xs text-emerald-600 mt-0.5">Enviado com sucesso</p>
                  )}
                  {isRejected && doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Motivo: {doc.rejectionReason}
                    </p>
                  )}
                  {isRejected && !doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">Reprovado — envie novamente</p>
                  )}
                  {!doc.isValid && !isUploaded && !isRejected && doc.expiryDate && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Expirado em {new Date(doc.expiryDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {!doc.isValid && !isUploaded && !isRejected && !doc.expiryDate && (
                    <p className="text-xs text-amber-600 mt-0.5">Não enviado anteriormente</p>
                  )}
                </div>
              </div>

              {(!doc.isValid || isRejected) && !isUploaded && (
                <div className="shrink-0 ml-3">
                  <button
                    onClick={() => fileRefs.current[doc.documentType]?.click()}
                    disabled={isUploading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${
                      isRejected ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {isRejected ? 'Reenviar' : 'Enviar'}
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[doc.documentType] = el; }}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(doc.documentType, file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
