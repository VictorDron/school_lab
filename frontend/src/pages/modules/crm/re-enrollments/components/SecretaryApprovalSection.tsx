import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  FileText,
  Loader2,
  Clock,
  FolderOpen,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';

// ── Types ──

interface PendingInvite {
  id: string;
  gateStatus: string;
  status: string;
  student: {
    id: string;
    fullName: string;
    grade: string | null;
    code: string;
  };
  confirmedAt: string | null;
}

interface InviteDocument {
  id: string;
  documentType: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
}

interface Props {
  periodId: string;
}

// ── Doc label helper ──

const DOC_LABELS: Record<string, string> = {
  MEDICAL_CERTIFICATE: 'Atestado Médico para Prática de Esportes',
  RESIDENCE_PROOF: 'Comprovante de Residência',
  MEDICAL_REPORT: 'Laudo Médico / Psicológico',
  STUDENT_ID: 'RG do Aluno',
  STUDENT_CPF: 'CPF do Aluno',
  BIRTH_CERTIFICATE: 'Certidão de Nascimento',
  VACCINATION_CARD: 'Caderneta de Vacinação',
  STUDENT_PHOTO: 'Foto 3x4 do Aluno',
};

function getDocLabel(docType: string): string {
  return DOC_LABELS[docType] || docType;
}

// ── Status badge ──

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full"><CheckCircle className="w-3 h-3" /> Aprovado</span>;
  if (status === 'REJECTED') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full"><XCircle className="w-3 h-3" /> Reprovado</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full"><Clock className="w-3 h-3" /> Pendente</span>;
}

// ── Doc Review Modal ──

function DocReviewModal({
  inviteId,
  studentName,
  onClose,
}: {
  inviteId: string;
  studentName: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: docs, isLoading } = useQuery({
    queryKey: ['inviteDocuments', inviteId],
    queryFn: async () => {
      const res = await api.get(`/re-enrollment/invites/${inviteId}/documents`);
      return res.data.data as InviteDocument[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ docId, status, reason }: { docId: string; status: string; reason?: string }) => {
      await api.patch(`/re-enrollment/invites/${inviteId}/documents/${docId}/review`, {
        status,
        rejectionReason: reason,
      });
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'APPROVED' ? 'Documento aprovado!' : 'Documento reprovado.');
      queryClient.invalidateQueries({ queryKey: ['inviteDocuments', inviteId] });
      setRejectingDocId(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao revisar documento.');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/re-enrollment/invites/${inviteId}/regenerate-link`);
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success('Novo link gerado e e-mail enviado ao responsável!');
      queryClient.invalidateQueries({ queryKey: ['inviteDocuments', inviteId] });
      queryClient.invalidateQueries({ queryKey: ['pendingDocsApproval'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao gerar novo link.');
    },
  });

  const hasRejected = docs?.some((d) => d.status === 'REJECTED');
  const hasPending = docs?.some((d) => d.status === 'PENDING');
  const allApproved = docs && docs.length > 0 && docs.every((d) => d.status === 'APPROVED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Revisão de Documentos</h3>
              <p className="text-sm text-neutral-500">{studentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
          ) : !docs || docs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm">Nenhum documento enviado por esta família.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div key={doc.id} className={`border rounded-lg p-4 ${doc.status === 'REJECTED' ? 'border-red-200 bg-red-50/30' : doc.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/30' : 'border-neutral-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-800">{getDocLabel(doc.documentType)}</p>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{doc.fileName} — {(doc.fileSize / 1024).toFixed(0)} KB</p>
                      {doc.status === 'REJECTED' && doc.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 ml-3 shrink-0">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                          <Eye className="w-3 h-3" /> Ver
                        </a>
                      )}
                      {doc.status !== 'APPROVED' && (
                        <button
                          onClick={() => reviewMutation.mutate({ docId: doc.id, status: 'APPROVED' })}
                          disabled={reviewMutation.isPending}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" /> Aprovar
                        </button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <button
                          onClick={() => { setRejectingDocId(doc.id); setRejectionReason(''); }}
                          disabled={reviewMutation.isPending}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" /> Reprovar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason input */}
                  {rejectingDocId === doc.id && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <label className="block text-xs font-medium text-red-800 mb-1">Motivo da reprovação *</label>
                      <textarea
                        className="w-full rounded border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={2}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Descreva o motivo da reprovação..."
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            if (!rejectionReason.trim()) { toast.error('Informe o motivo da reprovação.'); return; }
                            reviewMutation.mutate({ docId: doc.id, status: 'REJECTED', reason: rejectionReason.trim() });
                          }}
                          disabled={reviewMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {reviewMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                          Confirmar Reprovação
                        </button>
                        <button onClick={() => setRejectingDocId(null)} className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-800">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-neutral-50 rounded-b-2xl">
          {allApproved && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 mb-3">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Todos os documentos aprovados. Você pode aprovar o cadastro.</span>
            </div>
          )}
          {hasRejected && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span>Documentos reprovados — gere um novo link para a família reenviar.</span>
              </div>
              <button
                onClick={() => regenerateMutation.mutate()}
                disabled={regenerateMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {regenerateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Gerar Novo Link e Notificar
              </button>
            </div>
          )}
          {!allApproved && !hasRejected && hasPending && (
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Revise todos os documentos antes de aprovar o cadastro.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function SecretaryApprovalSection({ periodId }: Props) {
  const queryClient = useQueryClient();
  const [reviewInvite, setReviewInvite] = useState<PendingInvite | null>(null);

  useEffect(() => {
    if (!periodId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('re-enrollment:period:join', periodId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDocsApproval', periodId] });
    };

    socket.on('re-enrollment:invite:created', handleUpdate);
    socket.on('re-enrollment:invite:updated', handleUpdate);

    return () => {
      socket.off('re-enrollment:invite:created', handleUpdate);
      socket.off('re-enrollment:invite:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey: ['pendingDocsApproval', periodId],
    queryFn: async () => {
      const res = await api.get(`/re-enrollment/periods/${periodId}/invites`, {
        params: { gateStatus: 'FORMULARIO_CONFIRMADO' },
      });
      const invites = res.data.data || [];
      return invites as PendingInvite[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await api.patch(`/re-enrollment/invites/${inviteId}/gate-transition`, {
        gateStatus: 'DOCS_APROVADOS',
      });
    },
    onSuccess: () => {
      toast.success('Documentos aprovados!');
      queryClient.invalidateQueries({ queryKey: ['pendingDocsApproval', periodId] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites', periodId] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement', periodId] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || 'Erro ao aprovar documentos.';
      toast.error(msg);
    },
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-blue-800">
            Aprovação de Documentos e Cadastro ({data.length})
          </h4>
        </div>
        <p className="text-xs text-blue-600 mb-3">
          Alunos que preencheram o formulário de rematrícula e aguardam aprovação da secretaria.
        </p>
        <div className="space-y-2">
          {data.map((invite) => (
            <div
              key={invite.id}
              className="bg-white border border-blue-100 rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-800 truncate">
                  {invite.student.fullName}
                </div>
                <div className="text-xs text-neutral-500">
                  {invite.student.grade} — {invite.student.code}
                </div>
                {invite.confirmedAt && (
                  <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Formulário enviado em {new Date(invite.confirmedAt).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
              <div className="flex gap-1.5 ml-3 shrink-0">
                <button
                  onClick={() => setReviewInvite(invite)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Revisar Documentos
                </button>
                <button
                  onClick={() => approveMutation.mutate(invite.id)}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  Aprovar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doc Review Modal */}
      {reviewInvite && (
        <DocReviewModal
          inviteId={reviewInvite.id}
          studentName={`${reviewInvite.student.fullName} — ${reviewInvite.student.grade}`}
          onClose={() => setReviewInvite(null)}
        />
      )}
    </>
  );
}
