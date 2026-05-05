import { useState, useMemo } from 'react';
import { Upload, FileText, LayoutList, CheckSquare, FolderOpen, ClipboardList } from 'lucide-react';
import {
  useUploadLeadDocument,
  useDeleteLeadDocument,
  useDeleteEnrollmentDocumentCRM,
  useReviewEnrollmentDocument,
} from '@/hooks/useLeads';
import type { Lead } from '@/types/crm';
import { DocumentProgress } from './DocumentProgress';
import { DocumentChecklist } from './DocumentChecklist';
import { DocumentList } from './DocumentList';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { DocumentUploadZone } from './DocumentUploadZone';
import { ReviewDocumentModal } from './ReviewDocumentModal';
import { mergeDocuments, type UnifiedDocument } from './utils';

interface LeadDocumentsTabProps {
  lead: Lead;
  canEdit: boolean;
}

export function LeadDocumentsTab({ lead, canEdit }: LeadDocumentsTabProps) {
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; source: 'ADMISSION' | 'ENROLLMENT' } | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UnifiedDocument | null>(null);
  const [reviewingDoc, setReviewingDoc] = useState<UnifiedDocument | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'checklist'>('list');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'ADMISSION' | 'ENROLLMENT'>('ALL');

  // Upload state
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [selectedType, setSelectedType] = useState('OTHER');
  const [selectedChildId, setSelectedChildId] = useState('');

  const deleteAdmissionMutation = useDeleteLeadDocument();
  const deleteEnrollmentMutation = useDeleteEnrollmentDocumentCRM();
  const uploadMutation = useUploadLeadDocument();
  const reviewMutation = useReviewEnrollmentDocument();

  const admissionDocs = lead.documents || [];
  const enrollmentDocs = lead.enrollmentDocuments || [];
  const children = lead.children || [];

  const allDocuments = useMemo(
    () => mergeDocuments(admissionDocs, enrollmentDocs),
    [admissionDocs, enrollmentDocs]
  );

  const filteredDocuments = useMemo(() => {
    if (sourceFilter === 'ALL') return allDocuments;
    return allDocuments.filter((d) => d.source === sourceFilter);
  }, [allDocuments, sourceFilter]);

  const handleDelete = () => {
    if (!deletingDoc) return;
    if (deletingDoc.source === 'ENROLLMENT') {
      deleteEnrollmentMutation.mutate(
        { leadId: lead.id, docId: deletingDoc.id },
        { onSuccess: () => setDeletingDoc(null) }
      );
    } else {
      deleteAdmissionMutation.mutate(
        { leadId: lead.id, docId: deletingDoc.id },
        { onSuccess: () => setDeletingDoc(null) }
      );
    }
  };

  const handleReview = (status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    if (!reviewingDoc) return;
    reviewMutation.mutate(
      { leadId: lead.id, docId: reviewingDoc.id, status, rejectionReason },
      { onSuccess: () => setReviewingDoc(null) }
    );
  };

  const handleUpload = () => {
    if (uploadingFiles.length === 0) return;
    uploadingFiles.forEach((file) => {
      const docName = selectedChildId
        ? `${children.find((c) => c.id === selectedChildId)?.fullName.split(' ')[0] || ''} - ${file.name}`
        : file.name;
      uploadMutation.mutate(
        { leadId: lead.id, file, type: selectedType, name: docName, childId: selectedChildId || undefined },
        {
          onSuccess: () => {
            setUploadingFiles([]);
            setSelectedType('OTHER');
            setSelectedChildId('');
          },
        }
      );
    });
  };

  const admissionCount = admissionDocs.length;
  const enrollmentCount = enrollmentDocs.length;
  const totalDocs = allDocuments.length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary-100 rounded-lg">
          <FolderOpen className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900">Documentos</h3>
          <p className="text-xs text-neutral-500">
            {totalDocs} documento{totalDocs !== 1 ? 's' : ''} no total
            {admissionCount > 0 && (
              <span className="ml-1">
                · <span className="text-blue-600">{admissionCount} admissão</span>
              </span>
            )}
            {enrollmentCount > 0 && (
              <span className="ml-1">
                · <span className="text-emerald-600">{enrollmentCount} matrícula</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Documentation Progress */}
      <DocumentProgress lead={lead} documents={allDocuments} />

      {/* Source Filter Cards */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setSourceFilter('ALL')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            sourceFilter === 'ALL'
              ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-200'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <FolderOpen className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-[10px] font-medium text-neutral-500 uppercase">Todos</span>
          </div>
          <span className="text-lg font-bold text-neutral-900">{totalDocs}</span>
        </button>
        <button
          onClick={() => setSourceFilter('ADMISSION')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            sourceFilter === 'ADMISSION'
              ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-medium text-neutral-500 uppercase">Admissão</span>
          </div>
          <span className="text-lg font-bold text-neutral-900">{admissionCount}</span>
        </button>
        <button
          onClick={() => setSourceFilter('ENROLLMENT')}
          className={`p-2.5 rounded-xl border text-left transition-all ${
            sourceFilter === 'ENROLLMENT'
              ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
              : 'border-neutral-200 bg-white hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-medium text-neutral-500 uppercase">Matrícula</span>
          </div>
          <span className="text-lg font-bold text-neutral-900">{enrollmentCount}</span>
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
        <div className="flex">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'list'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Lista
            {filteredDocuments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">
                {filteredDocuments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('checklist')}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'checklist'
                ? 'border-primary-500 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Checklist
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <DocumentList
          documents={filteredDocuments}
          children={children}
          onPreview={setPreviewDoc}
          onDelete={(doc) => setDeletingDoc({ id: doc.id, source: doc.source })}
          onReview={(doc) => setReviewingDoc(doc)}
          canEdit={canEdit}
        />
      )}

      {/* Checklist View */}
      {viewMode === 'checklist' && (
        <DocumentChecklist
          documents={allDocuments}
          children={children}
        />
      )}

      {/* Upload Zone */}
      {canEdit && (
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-700">Enviar Documento</h3>
          </div>
          <DocumentUploadZone
            uploadingFiles={uploadingFiles}
            setUploadingFiles={setUploadingFiles}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedChildId={selectedChildId}
            setSelectedChildId={setSelectedChildId}
            children={children}
            onUpload={handleUpload}
            isUploading={uploadMutation.isPending}
            canEdit={canEdit}
          />
        </div>
      )}

      {/* Modals */}
      <DocumentPreviewModal document={previewDoc} onClose={() => setPreviewDoc(null)} />
      <DeleteConfirmationModal
        isOpen={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={handleDelete}
        isDeleting={deleteAdmissionMutation.isPending || deleteEnrollmentMutation.isPending}
      />
      <ReviewDocumentModal
        document={reviewingDoc}
        onClose={() => setReviewingDoc(null)}
        onApprove={() => handleReview('APPROVED')}
        onReject={(reason) => handleReview('REJECTED', reason)}
        isLoading={reviewMutation.isPending}
      />
    </div>
  );
}
