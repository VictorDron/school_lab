import { Loader2, Upload, X } from 'lucide-react';
import {
  getDocumentsByCategory,
  type DocumentCategory,
  type DocumentTypeConfig,
  type EnrollmentDocument,
} from '@/types/enrollment';
import type { EnrollmentDocumentsStepProps } from './types';

// ---------------------------------------------------------------------------
// Helper: render a single document row
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
// EnrollmentDocumentsStep
// ---------------------------------------------------------------------------

export function EnrollmentDocumentsStep({
  watch,
  language,
  enrollmentStudents,
  activeStudentTab,
  onTabSwitch,
  enrollmentData,
  token,
  watchFinancialResponsible,
  uploadProgress,
  setUploadProgress,
  optimisticIncludes,
  setOptimisticIncludes,
  uploadDocMutation,
  deleteDocMutation,
  toggleIncludesMutation,
}: EnrollmentDocumentsStepProps) {
  const isMultiChild = enrollmentStudents.length > 1;
  const sharedCategories: DocumentCategory[] = ['MOTHER', 'FATHER'];
  if (watchFinancialResponsible?.responsibleType === 'OTHER') {
    sharedCategories.push('FINANCIAL_RESPONSIBLE');
  }
  sharedCategories.push('SCHOOL');

  const uploadedDocs = enrollmentData?.documents || [];

  // Filter student docs based on health conditions (must match validation logic)
  const healthData = watch('health');
  const hasHealthConditions = !!(
    (healthData?.medicalConditions && healthData.medicalConditions.length > 0 && !healthData.medicalConditions.every((c: string) => c === 'NONE')) ||
    healthData?.hasHospitalizations ||
    healthData?.hasSeizures ||
    (healthData?.allergies && healthData.allergies.length > 0 && !healthData.allergies.every((a: string) => a === 'NONE')) ||
    healthData?.hasEatingDisorder
  );
  const studentDocTypes = getDocumentsByCategory('STUDENT').filter((doc) => {
    if (doc.conditionalOn === 'hasHealthConditions') return hasHealthConditions;
    return true;
  });

  // Calculate total required docs
  const finPersonType = watchFinancialResponsible?.personType as 'INDIVIDUAL' | 'COMPANY' | undefined;
  const sharedRequiredDocs = sharedCategories.flatMap(cat =>
    getDocumentsByCategory(cat).filter(d => {
      if (!d.required) return false;
      if (d.personTypeFilter && d.personTypeFilter !== finPersonType) return false;
      return true;
    })
  );
  const studentRequiredDocs = studentDocTypes.filter(d => d.required);
  const numChildren = isMultiChild ? enrollmentStudents.length : 1;
  const totalRequiredCount = sharedRequiredDocs.length + (studentRequiredDocs.length * numChildren);

  // Helper: check if a required doc type is covered
  const isDocCovered = (docType: string, category: string, childId?: string) => {
    return uploadedDocs.some((upDoc: any) => {
      const matchesChild = childId ? upDoc.childId === childId : (category !== 'STUDENT' || upDoc.category === category);
      const categoryMatch = category !== 'STUDENT' ? upDoc.category !== 'STUDENT' : upDoc.category === 'STUDENT';
      if (upDoc.documentType === docType && categoryMatch && matchesChild) return true;
      if (categoryMatch && matchesChild && upDoc.includesOtherDocs?.includes(docType)) return true;
      return false;
    });
  };

  // Count uploaded required docs
  let uploadedRequiredCount = sharedRequiredDocs.filter(reqDoc =>
    isDocCovered(reqDoc.type, reqDoc.category)
  ).length;

  if (isMultiChild) {
    for (const student of enrollmentStudents) {
      uploadedRequiredCount += studentRequiredDocs.filter(reqDoc =>
        isDocCovered(reqDoc.type, 'STUDENT', (student as any).id)
      ).length;
    }
  } else {
    uploadedRequiredCount += studentRequiredDocs.filter(reqDoc =>
      isDocCovered(reqDoc.type, 'STUDENT')
    ).length;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-neutral-900">
        {language === 'pt' ? 'Documentos' : 'Documents'}
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-blue-800">
            {language === 'pt'
              ? 'Envie os documentos necessários para completar a matrícula. Documentos obrigatórios estão marcados com *.'
              : 'Upload the required documents to complete enrollment. Required documents are marked with *.'}
          </p>
          <div className="ml-4 flex-shrink-0">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              uploadedRequiredCount === totalRequiredCount
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {uploadedRequiredCount}/{totalRequiredCount} {language === 'pt' ? 'obrigatórios' : 'required'}
            </span>
          </div>
        </div>
      </div>

      {/* STUDENT documents - per child for multi-child */}
      {isMultiChild ? (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">
            {language === 'pt' ? 'Documentos dos Alunos' : 'Student Documents'}
          </h3>
          {/* Child tabs */}
          <div className="flex gap-2 mb-4 border-b">
            {enrollmentStudents.map((student: any, idx: number) => {
              const childRequiredUploaded = studentRequiredDocs.filter(reqDoc =>
                isDocCovered(reqDoc.type, 'STUDENT', student.id)
              ).length;
              const allChildReqDone = childRequiredUploaded === studentRequiredDocs.length;

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onTabSwitch(idx)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeStudentTab === idx
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {student.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${idx + 1}`}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                    allChildReqDone ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {childRequiredUploaded}/{studentRequiredDocs.length}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Active child's documents */}
          <div className="space-y-3">
            {studentDocTypes.map((docType) => {
              const activeChild = enrollmentStudents[activeStudentTab] as any;
              const childId = activeChild?.id;
              const uploaded = uploadedDocs.find(
                (d: any) => d.documentType === docType.type && d.category === 'STUDENT' && d.childId === childId
              );
              const includedIn = !uploaded ? uploadedDocs.find(
                (d: any) => d.category === 'STUDENT' && d.childId === childId && d.includesOtherDocs?.includes(docType.type)
              ) : undefined;
              const progressKey = `${docType.type}_${childId}`;
              return renderDocumentRow(
                docType, 'STUDENT', uploaded || includedIn, progressKey,
                language, uploadProgress, setUploadProgress,
                optimisticIncludes, setOptimisticIncludes,
                uploadDocMutation, deleteDocMutation, toggleIncludesMutation,
                token, childId,
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">
            {language === 'pt' ? 'Documentos do Aluno' : 'Student Documents'}
          </h3>
          <div className="space-y-3">
            {studentDocTypes.map((docType) => {
              const uploaded = uploadedDocs.find(
                (d: any) => d.documentType === docType.type && d.category === 'STUDENT'
              );
              const includedIn = !uploaded ? uploadedDocs.find(
                (d: any) => d.category === 'STUDENT' && d.includesOtherDocs?.includes(docType.type)
              ) : undefined;
              return renderDocumentRow(
                docType, 'STUDENT', uploaded || includedIn, docType.type,
                language, uploadProgress, setUploadProgress,
                optimisticIncludes, setOptimisticIncludes,
                uploadDocMutation, deleteDocMutation, toggleIncludesMutation,
                token,
              );
            })}
          </div>
        </div>
      )}

      {/* Shared categories (MOTHER, FATHER, FINANCIAL_RESPONSIBLE, SCHOOL) */}
      {sharedCategories.map((category) => {
        const allDocs = getDocumentsByCategory(category);
        const docs = allDocs.filter((doc) => {
          if (doc.conditionalOn === 'hasHealthConditions') return hasHealthConditions;
          if (doc.personTypeFilter && doc.personTypeFilter !== finPersonType) return false;
          return true;
        });

        const categoryLabel = ({
          STUDENT: language === 'pt' ? 'Documentos do Aluno' : 'Student Documents',
          MOTHER: language === 'pt' ? 'Documentos da Mãe' : 'Mother Documents',
          FATHER: language === 'pt' ? 'Documentos do Pai' : 'Father Documents',
          FINANCIAL_RESPONSIBLE: language === 'pt' ? 'Documentos do Resp. Financeiro' : 'Financial Responsible Documents',
          SCHOOL: language === 'pt' ? 'Documentos Escolares' : 'School Documents',
        } as Record<string, string>)[category];

        const catUploadedDocs = uploadedDocs.filter((d: any) => d.category === category);

        return (
          <div key={category} className="border rounded-lg p-4">
            <h3 className="font-medium mb-4">{categoryLabel}</h3>
            <div className="space-y-3">
              {docs.map((docType) => {
                const uploaded = catUploadedDocs.find((d: any) => d.documentType === docType.type);
                const includedIn = !uploaded ? catUploadedDocs.find(
                  (d: any) => d.includesOtherDocs?.includes(docType.type)
                ) : undefined;
                return renderDocumentRow(
                  docType, category, uploaded || includedIn, docType.type,
                  language, uploadProgress, setUploadProgress,
                  optimisticIncludes, setOptimisticIncludes,
                  uploadDocMutation, deleteDocMutation, toggleIncludesMutation,
                  token,
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
