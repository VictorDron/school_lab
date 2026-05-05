import { Loader2, Upload, X } from 'lucide-react';
import {
  FINANCIAL_RELATIONSHIP_OPTIONS,
  FINANCIAL_PERSON_TYPE_OPTIONS,
  getFinancialResponsibleDocs,
  type DocumentCategory,
  type DocumentTypeConfig,
  type EnrollmentDocument,
} from '@/types/enrollment';
import { brazilianStates } from '@/constants/brazilianStates';
import { formatCPF, formatCNPJ, formatPhone } from '@/components/public/shared';
import type { EnrollmentFinancialStepProps } from './types';

// ---------------------------------------------------------------------------
// Helper: render a single document row (used by the financial step inline)
// ---------------------------------------------------------------------------

function renderDocumentRow(
  docType: DocumentTypeConfig,
  category: DocumentCategory,
  uploaded: EnrollmentDocument | undefined,
  progressKey: string,
  language: string,
  uploadProgress: Record<string, { progress: number; fileName: string }>,
  setUploadProgress: React.Dispatch<React.SetStateAction<Record<string, { progress: number; fileName: string }>>>,
  optimisticIncludes: Record<string, boolean>,
  setOptimisticIncludes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  uploadDocMutation: any,
  deleteDocMutation: any,
  toggleIncludesMutation: any,
  token: string | null,
  childId?: string,
) {
  const currentUpload = uploadProgress[progressKey];
  const isUploading = !!currentUpload;
  const isDirectUpload = uploaded && uploaded.documentType === docType.type;
  const hasCanInclude = docType.canInclude && docType.canInclude.length > 0;
  const serverIncluded = isDirectUpload && hasCanInclude && uploaded.includesOtherDocs?.includes(docType.canInclude![0]);
  const toggleKey = isDirectUpload ? uploaded.id : '';
  const cpfIncluded = toggleKey && toggleKey in optimisticIncludes ? optimisticIncludes[toggleKey] : !!serverIncluded;

  return (
    <div key={progressKey} className="p-3 bg-neutral-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium">
              {language === 'pt' ? docType.labelPt : docType.labelEn}
              {docType.required && <span className="text-red-500 ml-1">*</span>}
            </span>
            {uploaded && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                {language === 'pt' ? 'Enviado' : 'Uploaded'}
              </span>
            )}
            {isUploading && (
              <span className="text-xs text-neutral-500 truncate">
                {currentUpload.fileName}
              </span>
            )}
          </div>
          {(docType.notePt || docType.noteEn) && (
            <p className="text-xs text-neutral-500 mt-1 italic">
              {language === 'pt' ? docType.notePt : docType.noteEn}
            </p>
          )}
          {isDirectUpload && hasCanInclude && token && (
            <label
              className="inline-flex items-center gap-2 mt-2 cursor-pointer select-none"
              onClick={() => {
                if (toggleIncludesMutation.isPending) return;
                const newValue = !cpfIncluded;
                setOptimisticIncludes(prev => ({ ...prev, [uploaded.id]: newValue }));
                const newIncludes = newValue ? [...docType.canInclude!] : [];
                toggleIncludesMutation.mutate(
                  { token, documentId: uploaded.id, includesOtherDocs: newIncludes },
                  {
                    onSettled: () => {
                      setOptimisticIncludes(prev => {
                        const next = { ...prev };
                        delete next[uploaded.id];
                        return next;
                      });
                    },
                    onError: () => {
                      setOptimisticIncludes(prev => ({ ...prev, [uploaded.id]: !newValue }));
                    },
                  }
                );
              }}
            >
              <span
                role="switch"
                aria-checked={cpfIncluded}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  cpfIncluded ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
                  style={{ transform: `translateX(${cpfIncluded ? '18px' : '2px'}) translateY(2px)` }}
                />
              </span>
              <span className="text-xs text-neutral-600">
                {language === 'pt' ? 'CPF consta neste documento?' : 'Does this document include CPF?'}
              </span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2">
          {uploaded ? (
            <>
              <a
                href={uploaded.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                {language === 'pt' ? 'Ver' : 'View'}
              </a>
              <button
                type="button"
                onClick={() => {
                  if (token && uploaded.id) {
                    deleteDocMutation.mutate({ token, documentId: uploaded.id });
                  }
                }}
                className="text-red-500 hover:text-red-700"
                disabled={deleteDocMutation.isPending}
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : isUploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-xs text-primary-600 font-medium">
                {currentUpload.progress}%
              </span>
            </div>
          ) : (
            <label className="cursor-pointer flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm">
              <Upload className="w-4 h-4" />
              {language === 'pt' ? 'Enviar' : 'Upload'}
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && token) {
                    setUploadProgress(prev => ({
                      ...prev,
                      [progressKey]: { progress: 0, fileName: file.name }
                    }));

                    uploadDocMutation.mutate(
                      {
                        token,
                        file,
                        documentType: docType.type,
                        category,
                        childId,
                        includesOtherDocs: undefined,
                        onProgress: (progress: number) => {
                          setUploadProgress(prev => ({
                            ...prev,
                            [progressKey]: { ...prev[progressKey], progress }
                          }));
                        },
                      },
                      {
                        onSettled: () => {
                          setUploadProgress(prev => {
                            const newState = { ...prev };
                            delete newState[progressKey];
                            return newState;
                          });
                        },
                      }
                    );
                  }
                  e.target.value = '';
                }}
                disabled={uploadDocMutation.isPending}
              />
            </label>
          )}
        </div>
      </div>
      {isUploading && (
        <div className="mt-2">
          <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${currentUpload.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EnrollmentFinancialStep
// ---------------------------------------------------------------------------

export function EnrollmentFinancialStep({
  register,
  setValue,
  watch,
  language,
  watchFinancialResponsible,
  enrollmentData,
  token,
  uploadProgress,
  setUploadProgress,
  optimisticIncludes,
  setOptimisticIncludes,
  uploadDocMutation,
  deleteDocMutation,
  toggleIncludesMutation,
}: EnrollmentFinancialStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Responsável Financeiro' : 'Financial Responsible'}
      </h2>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-amber-800">
          {language === 'pt'
            ? 'Selecione quem será o responsável financeiro. Ao selecionar "Outro", todos os dados são obrigatórios.'
            : 'Select who will be the financial responsible. When selecting "Other", all data is required.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {language === 'pt' ? 'Quem é o responsável financeiro?' : 'Who is the financial responsible?'} <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              value="FATHER"
              {...register('financialResponsible.responsibleType')}
              className="text-primary-600"
            />
            <span className="font-medium">{language === 'pt' ? 'Pai' : 'Father'}</span>
          </label>
          <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              value="MOTHER"
              {...register('financialResponsible.responsibleType')}
              className="text-primary-600"
            />
            <span className="font-medium">{language === 'pt' ? 'Mãe' : 'Mother'}</span>
          </label>
          <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer">
            <input
              type="radio"
              value="OTHER"
              {...register('financialResponsible.responsibleType')}
              className="text-primary-600"
            />
            <span className="font-medium">{language === 'pt' ? 'Outro' : 'Other'}</span>
          </label>
        </div>
      </div>

      {watchFinancialResponsible?.responsibleType === 'OTHER' && (
        <>
          {/* Person Type selector */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {language === 'pt' ? 'Tipo de Pessoa' : 'Person Type'} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {FINANCIAL_PERSON_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer flex-1">
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('financialResponsible.personType')}
                    className="text-primary-600"
                  />
                  <span className="font-medium">{language === 'pt' ? opt.labelPt : opt.labelEn}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Relationship dropdown -- only for Pessoa Fisica */}
          {(!watchFinancialResponsible?.personType || watchFinancialResponsible?.personType === 'INDIVIDUAL') && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {language === 'pt' ? 'Parentesco' : 'Relationship'} <span className="text-red-500">*</span>
              </label>
              <select {...register('financialResponsible.relationship')} className="input">
                <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                {FINANCIAL_RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {language === 'pt' ? opt.labelPt : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Pessoa Fisica fields */}
          {(!watchFinancialResponsible?.personType || watchFinancialResponsible?.personType === 'INDIVIDUAL') && (
            <div className="border rounded-lg p-4 space-y-4 bg-neutral-50">
              <h3 className="font-medium text-lg">
                {language === 'pt' ? 'Dados do Responsável Financeiro' : 'Financial Responsible Data'} <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-neutral-500">
                {language === 'pt' ? 'Todos os campos abaixo são obrigatórios.' : 'All fields below are required.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Nome completo' : 'Full name'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.fullName')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    CPF <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('financialResponsible.cpf')}
                    className="input"
                    placeholder="000.000.000-00"
                    onChange={(e) => setValue('financialResponsible.cpf', formatCPF(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input type="email" {...register('financialResponsible.email')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Telefone' : 'Phone'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('financialResponsible.phone')}
                    className="input"
                    onChange={(e) => setValue('financialResponsible.phone', formatPhone(e.target.value))}
                  />
                </div>
              </div>

              <h4 className="font-medium mt-4">
                {language === 'pt' ? 'Endereço' : 'Address'} <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Estado' : 'State'} <span className="text-red-500">*</span>
                  </label>
                  <select {...register('financialResponsible.address.state')} className="input">
                    <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                    {brazilianStates.map((state) => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Cidade' : 'City'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.city')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Bairro' : 'Neighborhood'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.neighborhood')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Rua' : 'Street'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.street')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Número' : 'Number'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.number')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Complemento' : 'Complement'}
                  </label>
                  <input {...register('financialResponsible.address.complement')} className="input" />
                </div>
              </div>
            </div>
          )}

          {/* Pessoa Juridica fields */}
          {watchFinancialResponsible?.personType === 'COMPANY' && (
            <div className="border rounded-lg p-4 space-y-4 bg-neutral-50">
              <h3 className="font-medium text-lg">
                {language === 'pt' ? 'Dados da Empresa' : 'Company Data'} <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-neutral-500">
                {language === 'pt' ? 'Todos os campos abaixo são obrigatórios, exceto Nome Fantasia.' : 'All fields below are required, except Trade Name.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Razão Social' : 'Company Name'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.companyName')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('financialResponsible.cnpj')}
                    className="input"
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => setValue('financialResponsible.cnpj', formatCNPJ(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Nome Fantasia' : 'Trade Name'}
                  </label>
                  <input {...register('financialResponsible.tradeName')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Responsável na empresa' : 'Contact Person'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.contactPerson')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Email de contato' : 'Contact Email'} <span className="text-red-500">*</span>
                  </label>
                  <input type="email" {...register('financialResponsible.contactEmail')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Telefone de contato' : 'Contact Phone'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('financialResponsible.contactPhone')}
                    className="input"
                    onChange={(e) => setValue('financialResponsible.contactPhone', formatPhone(e.target.value))}
                  />
                </div>
              </div>

              <h4 className="font-medium mt-4">
                {language === 'pt' ? 'Endereço da empresa' : 'Company Address'} <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Estado' : 'State'} <span className="text-red-500">*</span>
                  </label>
                  <select {...register('financialResponsible.address.state')} className="input">
                    <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
                    {brazilianStates.map((state) => (
                      <option key={state.code} value={state.code}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Cidade' : 'City'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.city')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Bairro' : 'Neighborhood'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.neighborhood')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Rua' : 'Street'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.street')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Número' : 'Number'} <span className="text-red-500">*</span>
                  </label>
                  <input {...register('financialResponsible.address.number')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {language === 'pt' ? 'Complemento' : 'Complement'}
                  </label>
                  <input {...register('financialResponsible.address.complement')} className="input" />
                </div>
              </div>
            </div>
          )}

          {/* Document uploads for financial responsible */}
          {watchFinancialResponsible?.personType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-lg text-neutral-900">
                {language === 'pt' ? 'Documentos do Responsável Financeiro' : 'Financial Responsible Documents'}
              </h3>
              <p className="text-sm text-blue-800">
                {language === 'pt'
                  ? 'Envie os documentos do responsável financeiro. Estes documentos também aparecerão na etapa de Documentos.'
                  : 'Upload the financial responsible documents. These documents will also appear in the Documents step.'}
              </p>
              <div className="space-y-3">
                {getFinancialResponsibleDocs(watchFinancialResponsible.personType as 'INDIVIDUAL' | 'COMPANY').map((docType) => {
                  const uploadedDocs = enrollmentData?.documents || [];
                  const uploaded = uploadedDocs.find((d: any) => d.documentType === docType.type && d.category === 'FINANCIAL_RESPONSIBLE');
                  const includedIn = !uploaded ? uploadedDocs.find(
                    (d: any) => d.category === 'FINANCIAL_RESPONSIBLE' && d.includesOtherDocs?.includes(docType.type)
                  ) : undefined;
                  const progressKey = `step4_${docType.type}`;
                  return renderDocumentRow(
                    docType, 'FINANCIAL_RESPONSIBLE', uploaded || includedIn, progressKey,
                    language, uploadProgress, setUploadProgress,
                    optimisticIncludes, setOptimisticIncludes,
                    uploadDocMutation, deleteDocMutation, toggleIncludesMutation,
                    token,
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
