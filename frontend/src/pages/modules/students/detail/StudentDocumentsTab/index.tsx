import { useState } from 'react';
import clsx from 'clsx';
import { FileText, Upload } from 'lucide-react';
import { unifyDocuments } from './helpers';
import { DocumentRow } from './DocumentRow';
import { FilterTabs } from './FilterTabs';
import { StatusCards } from './StatusCards';
import { UploadStaging } from './UploadStaging';
import { PreviewModal } from './modals/PreviewModal';
import { ReviewModal } from './modals/ReviewModal';
import { DeleteModal } from './modals/DeleteModal';
import { EditTypeModal } from './modals/EditTypeModal';
import { useDocumentUpload } from './useDocumentUpload';
import type { DocumentRecord, FilterTab, StudentDocumentsTabProps } from './types';

export function StudentDocumentsTab({
  studentId,
  documents,
  enrollmentDocuments,
}: StudentDocumentsTabProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [reviewDoc, setReviewDoc] = useState<DocumentRecord | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentRecord | null>(null);
  const [editTypeDoc, setEditTypeDoc] = useState<DocumentRecord | null>(null);

  const {
    pendingFiles,
    handleRemovePending,
    handleChangePendingType,
    handleSubmitPending,
    isUploading,
    dropzone: { getRootProps, getInputProps, isDragActive },
  } = useDocumentUpload({ studentId });

  const allDocs = unifyDocuments(documents, enrollmentDocuments);
  const filteredDocs =
    activeFilter === 'all' ? allDocs : allDocs.filter((d) => d.source === activeFilter);
  const admissionCount = allDocs.filter((d) => d.source === 'admission').length;
  const enrollmentCount = allDocs.filter((d) => d.source === 'enrollment').length;
  const pendingCount = allDocs.filter((d) => d.status === 'PENDING').length;
  const approvedCount = allDocs.filter((d) => d.status === 'APPROVED').length;
  const rejectedCount = allDocs.filter((d) => d.status === 'REJECTED').length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800">Documentos</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          {allDocs.length} documento{allDocs.length !== 1 ? 's' : ''} no total
          {admissionCount > 0 && (
            <>
              {' '}
              · <span className="text-blue-600">{admissionCount} admissão</span>
            </>
          )}
          {enrollmentCount > 0 && (
            <>
              {' '}
              · <span className="text-violet-600">{enrollmentCount} matrícula</span>
            </>
          )}
        </p>
      </div>

      {allDocs.length > 0 && (
        <StatusCards
          pendingCount={pendingCount}
          approvedCount={approvedCount}
          rejectedCount={rejectedCount}
        />
      )}

      <FilterTabs
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        totalCount={allDocs.length}
        admissionCount={admissionCount}
        enrollmentCount={enrollmentCount}
      />

      {pendingFiles.length > 0 ? (
        <UploadStaging
          files={pendingFiles}
          onRemove={handleRemovePending}
          onChangeType={handleChangePendingType}
          onSubmit={handleSubmitPending}
          isUploading={isUploading}
        />
      ) : (
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-violet-400 bg-violet-50'
              : 'border-neutral-300 bg-neutral-50 hover:border-violet-300 hover:bg-violet-50/50',
          )}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center gap-2">
            <Upload className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-600">
              Arraste documentos aqui ou{' '}
              <span className="text-violet-600 font-medium">clique para selecionar</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            PDF, imagens ou documentos Word (máximo 10 MB)
          </p>
        </div>
      )}

      {filteredDocs.length > 0 ? (
        <div className="space-y-2">
          {filteredDocs.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onPreview={setPreviewDoc}
              onReview={setReviewDoc}
              onDelete={setDeleteDoc}
              onEditType={setEditTypeDoc}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">
            {activeFilter === 'all'
              ? 'Nenhum documento encontrado.'
              : `Nenhum documento de ${
                  activeFilter === 'admission' ? 'admissão' : 'matrícula'
                } encontrado.`}
          </p>
        </div>
      )}

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
      {reviewDoc && (
        <ReviewModal doc={reviewDoc} studentId={studentId} onClose={() => setReviewDoc(null)} />
      )}
      {deleteDoc && (
        <DeleteModal doc={deleteDoc} studentId={studentId} onClose={() => setDeleteDoc(null)} />
      )}
      {editTypeDoc && (
        <EditTypeModal doc={editTypeDoc} studentId={studentId} onClose={() => setEditTypeDoc(null)} />
      )}
    </div>
  );
}
